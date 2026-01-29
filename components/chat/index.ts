// components/chat/index.ts - Chat component exports

export { ChatSidebar, ConversationItem } from './ChatSidebar';
export { ChatMessages, AgentAvatar, ThinkingIndicator } from './ChatMessages';
export { ChatInput } from './ChatInput';
export { ChatHeader } from './ChatHeader';
export { CodePanel } from './CodePanel';
export { AgentStatus } from './AgentStatus';
export { PlanApproval } from './PlanApproval';
export { MessageBubble } from './MessageBubble';

// Type re-exports for convenience
export type { Conversation } from '@/types/chat';