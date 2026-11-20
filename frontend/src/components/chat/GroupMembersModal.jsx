import { Modal } from 'antd';
import { CrownOutlined } from '@ant-design/icons';
import { UserAvatar } from '../common/UserAvatar';

export const GroupMembersModal = ({ open, onClose, conversation, currentUserId }) => {
  const members = conversation?.participants || [];
  const ownerId = conversation?.createdBy?._id || conversation?.createdBy;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`Thành viên nhóm (${members.length})`}
      width={420}
      styles={{ body: { maxHeight: 440, overflowY: 'auto' } }}
    >
      <div className="member-list">
        {members.map((member) => {
          const memberId = member?._id || member;
          const isOwner = memberId === ownerId;
          const isMe = memberId === currentUserId;

          return (
            <div className="member-row" key={memberId}>
              <UserAvatar user={member} size={40} />
              <div className="member-info">
                <span className="member-name">
                  {member?.displayName || member?.username || 'Người dùng'}
                  {isMe && <span className="member-badge">Bạn</span>}
                </span>
                <span className="member-username">@{member?.username}</span>
              </div>
              {isOwner && (
                <span className="member-owner">
                  <CrownOutlined /> Trưởng nhóm
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
