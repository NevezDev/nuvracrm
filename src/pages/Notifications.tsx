import React from 'react';
import NotificationList from '../components/Notifications/NotificationList';

const Notifications: React.FC = () => {
  return (
    <div className="space-y-6">
      <NotificationList />
    </div>
  );
};

export default Notifications;