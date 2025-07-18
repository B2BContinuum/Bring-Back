import express from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticateJWT } from '../middleware/auth';

export default function messageRoutes(messageController: MessageController) {
  const router = express.Router();

  // Apply authentication middleware to all routes
  router.use(authenticateJWT);

  // Message routes
  router.post('/', messageController.sendMessage.bind(messageController));
  router.get('/conversations', messageController.getUserConversations.bind(messageController));
  router.get('/conversations/:userId', messageController.getConversation.bind(messageController));
  router.put('/messages/:messageId/read', messageController.markMessageAsRead.bind(messageController));
  router.put('/conversations/:userId/read', messageController.markConversationAsRead.bind(messageController));
  router.get('/unread/count', messageController.getUnreadMessageCount.bind(messageController));

  return router;
}