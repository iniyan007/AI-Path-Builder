const Notification = require('../models/Notification');
const { asyncHandler, paginate, buildPaginationMeta } = require('../utils/helpers');

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
  const { skip } = paginate(null, page, limit);
  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
      .populate('sender', 'name avatar'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json({ success: true, data: notifications, unreadCount, pagination: buildPaginationMeta(total, page, limit) });
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json({ success: true, message: 'Marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.status(200).json({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
