import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { conversationService } from '../../services/conversationService';
import { messageService } from '../../services/messageService';
import { friendService } from '../../services/friendService';
import { ConversationItem } from '../../components/conversation/ConversationItem';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageItem } from '../../components/chat/MessageItem';
import { MessageComposer } from '../../components/chat/MessageComposer';
import { Input, Button, Modal, Select, message, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const withMessage = (list, newMessage) => {
  const index = list.findIndex((c) => c._id === newMessage.conversation);
  if (index === -1) return list;
  const updated = [...list];
  updated[index] = {
    ...updated[index],
    lastMessage: newMessage,
    updatedAt: newMessage.createdAt || new Date().toISOString(),
  };
  const [moved] = updated.splice(index, 1);
  return [moved, ...updated];
};

export const ChatPage = () => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(conversationId || null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create conversation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [convType, setConvType] = useState('direct');
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeConv = useMemo(
    () => conversations.find((c) => c._id === activeConvId) || null,
    [conversations, activeConvId]
  );

  const selectConversation = (id) => {
    setActiveConvId(id);
    if (conversationId !== id) {
      navigate(`/chat/${id}`, { replace: true });
    }
  };

  // 1. Fetch conversations (also used to resync after socket reconnect)
  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationService.getConversations();
      setConversations(data);
      if (data.length > 0) {
        setActiveConvId((prev) =>
          prev && data.some((c) => c._id === prev) ? prev : data[0]._id
        );
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 2. Keep the active conversation in sync with the /chat/:conversationId URL
  useEffect(() => {
    if (conversationId) {
      setActiveConvId((prev) => (prev === conversationId ? prev : conversationId));
    }
  }, [conversationId]);

  // 3. Load messages only when the active conversation actually changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return undefined;
    }

    let cancelled = false;
    setMessages([]);
    setLoadingMessages(true);

    messageService
      .getMessages(activeConvId, 50)
      .then((msgs) => {
        if (cancelled) return;
        setMessages(msgs);
        setTimeout(scrollToBottom, 50);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to get messages:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeConvId]);

  // 4. Socket event listeners for realtime updates
  useEffect(() => {
    if (!socket) return undefined;

    const handleNewMessage = (newMsg) => {
      setConversations((prev) => withMessage(prev, newMsg));

      if (newMsg.conversation === activeConvId) {
        setMessages((prev) =>
          prev.some((m) => m._id === newMsg._id) ? prev : [...prev, newMsg]
        );
        setTimeout(scrollToBottom, 50);
      }
    };

    const handleMessageDeleted = ({ conversationId: convId, messageId, lastMessage }) => {
      if (convId === activeConvId) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, lastMessage } : c))
      );
    };

    const handleNewConversation = (conv) => {
      setConversations((prev) => [conv, ...prev.filter((c) => c._id !== conv._id)]);
    };

    const handleDeletedConversation = ({ conversationId: convId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (convId === activeConvId) {
        setActiveConvId(null);
        navigate('/chat', { replace: true });
      }
    };

    let hasConnected = socket.connected;
    const handleConnect = () => {
      if (!hasConnected) {
        hasConnected = true;
        return;
      }
      loadConversations();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('conversation:new', handleNewConversation);
    socket.on('conversation:deleted', handleDeletedConversation);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('conversation:new', handleNewConversation);
      socket.off('conversation:deleted', handleDeletedConversation);
      socket.off('connect', handleConnect);
    };
  }, [socket, activeConvId, navigate, loadConversations]);

  // 5. Send Message Handler
  const handleSendMessage = async ({ content, imgUrl }) => {
    if (!activeConvId) return;
    try {
      const sent = await messageService.sendMessage({
        conversationId: activeConvId,
        content,
        imgUrl,
      });

      setConversations((prev) => withMessage(prev, sent));
      if (sent.conversation === activeConvId) {
        setMessages((prev) =>
          prev.some((m) => m._id === sent._id) ? prev : [...prev, sent]
        );
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể gửi tin nhắn!');
      throw err;
    }
  };

  // 6. Delete Message Handler
  const handleDeleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      message.success('Đã xóa tin nhắn!');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể xóa tin nhắn!');
    }
  };

  // 7. Delete Conversation
  const handleDeleteConversation = () => {
    if (!activeConvId) return;
    const convId = activeConvId;
    Modal.confirm({
      title: 'Xóa cuộc trò chuyện này?',
      content: 'Toàn bộ tin nhắn trong cuộc trò chuyện sẽ bị xóa.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await conversationService.deleteConversation(convId);
          setConversations((prev) => prev.filter((c) => c._id !== convId));
          setActiveConvId(null);
          navigate('/chat', { replace: true });
          message.success('Đã xóa cuộc trò chuyện!');
        } catch (err) {
          console.error(err);
          message.error('Không thể xóa cuộc trò chuyện!');
        }
      },
    });
  };

  // 8. Open New Chat Modal
  const openNewChatModal = async () => {
    setIsModalOpen(true);
    try {
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedParticipants.length === 0) {
      message.warning('Vui lòng chọn ít nhất một người tham gia!');
      return;
    }
    if (convType === 'group' && !groupName.trim()) {
      message.warning('Vui lòng đặt tên nhóm!');
      return;
    }

    setCreating(true);
    try {
      const res = await conversationService.createConversation({
        type: convType,
        participants: selectedParticipants,
        name: convType === 'group' ? groupName.trim() : '',
      });

      const newConv = res.conversation || res;
      setConversations((prev) => [newConv, ...prev.filter((c) => c._id !== newConv._id)]);
      setActiveConvId(newConv._id);
      navigate(`/chat/${newConv._id}`, { replace: true });
      setIsModalOpen(false);
      setSelectedParticipants([]);
      setGroupName('');
      message.success('Tạo cuộc trò chuyện thành công!');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể tạo cuộc trò chuyện!');
    } finally {
      setCreating(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (c.name && c.name.toLowerCase().includes(q)) return true;
    return c.participants?.some(
      (p) =>
        p.displayName?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Middle Column: Conversation Sidebar */}
      <div className={`sub-sidebar ${activeConvId ? 'hide-mobile' : ''}`}>
        <div className="sub-sidebar-header">
          <span className="sub-sidebar-title">Đoạn chat</span>
          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            size="middle"
            onClick={openNewChatModal}
            style={{ backgroundColor: 'var(--primary)' }}
          />
        </div>

        <div className="sub-sidebar-search">
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: 20, background: '#F8FAFC' }}
          />
        </div>

        <div className="sub-sidebar-list">
          {loadingConv ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center' }}>
              <Empty description="Chưa có cuộc trò chuyện nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUserId={currentUser?._id}
                isActive={conv._id === activeConvId}
                onClick={() => selectConversation(conv._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Column: Main Chat Window */}
      <div className={`main-content ${!activeConvId ? 'hide-mobile' : ''}`}>
        {activeConv ? (
          <>
            <ChatHeader
              conversation={activeConv}
              currentUserId={currentUser?._id}
              onBack={() => {
                setActiveConvId(null);
                navigate('/chat', { replace: true });
              }}
              onDeleteConversation={handleDeleteConversation}
            />

            <div className="chat-feed">
              <div className="date-separator">Hôm nay</div>

              {loadingMessages ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Spin />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                  Hãy gửi lời chào đầu tiên!
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageItem
                    key={msg._id}
                    message={msg}
                    isMine={(msg.sender?._id || msg.sender) === currentUser?._id}
                    onDeleteMessage={handleDeleteMessage}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <MessageComposer onSendMessage={handleSendMessage} disabled={false} />
          </>
        ) : (
          <div className="empty-chat-state">
            <img src="/logo.png" alt="Chattie" />
            <h2>Chào mừng đến với Chattie!</h2>
            <p>
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo mới để bắt đầu nhắn tin với bạn bè.
            </p>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openNewChatModal}
              style={{ borderRadius: 8, height: 38, backgroundColor: 'var(--primary)' }}
            >
              Bắt đầu trò chuyện mới
            </Button>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <Modal
        title="Tạo cuộc trò chuyện mới"
        open={isModalOpen}
        onOk={handleCreateConversation}
        confirmLoading={creating}
        onCancel={() => setIsModalOpen(false)}
        okText="Bắt đầu chat"
        cancelText="Hủy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Loại cuộc trò chuyện:
            </label>
            <Select
              value={convType}
              onChange={(val) => {
                setConvType(val);
                setSelectedParticipants([]);
              }}
              style={{ width: '100%' }}
              options={[
                { value: 'direct', label: 'Trò chuyện trực tiếp (1-1)' },
                { value: 'group', label: 'Tạo nhóm chat' },
              ]}
            />
          </div>

          {convType === 'group' && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                Tên nhóm chat:
              </label>
              <Input
                placeholder="Nhập tên nhóm..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Chọn người tham gia từ danh bạ:
            </label>
            <Select
              mode={convType === 'group' ? 'multiple' : undefined}
              placeholder="Chọn bạn bè..."
              style={{ width: '100%' }}
              value={convType === 'group' ? selectedParticipants : selectedParticipants[0]}
              onChange={(val) => {
                if (convType === 'group') {
                  setSelectedParticipants(val);
                } else {
                  setSelectedParticipants(val ? [val] : []);
                }
              }}
              options={friends.map((f) => ({
                value: f.user?._id,
                label: `${f.user?.displayName || f.user?.username} (@${f.user?.username})`,
              }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
