import React, { useState, useEffect, useRef } from 'react';
import { getUserProfile, validateApiKey } from '../utils/userProfile';
import { WEB_API } from '../utils/api';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Divider,
  Slide,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Minimize as MinimizeIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      content: '안녕하세요! 🤖 AI 안전보고서 어시스턴트입니다.\n\n다음과 같은 도움을 드릴 수 있습니다:\n• 안전보고서 작성 가이드\n• 산업안전보건법 관련 질문\n• 위험성평가 방법론\n• 안전사고 대응 절차\n\n무엇을 도와드릴까요?', 
      type: 'assistant',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  // 로컬 스토리지에서 위치와 크기 복원
  useEffect(() => {
    const savedPosition = localStorage.getItem('chatbotWindowPosition');
    const savedSize = localStorage.getItem('chatbotWindowSize');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (error) {
        console.error('저장된 위치 복원 실패:', error);
      }
    }
    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize);
        setSize(parsed);
      } catch (error) {
        console.error('저장된 크기 복원 실패:', error);
      }
    }
  }, []);

  // 위치와 크기를 로컬 스토리지에 저장
  const savePosition = (newPosition) => {
    localStorage.setItem('chatbotWindowPosition', JSON.stringify(newPosition));
  };

  const saveSize = (newSize) => {
    localStorage.setItem('chatbotWindowSize', JSON.stringify(newSize));
  };

  // messages가 undefined일 때를 대비한 안전장치
  const safeMessages = messages || [];

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (messagesEndRef.current && safeMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [safeMessages]);

  // 마우스 다운 이벤트 (드래그 시작)
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
      return; // 버튼이나 입력 필드 클릭 시 드래그 방지
    }
    
    setIsDragging(true);
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  // 리사이즈 시작
  const handleResizeStart = (e) => {
    setIsResizing(true);
    const rect = chatRef.current.getBoundingClientRect();
    setResizeOffset({
      x: e.clientX - rect.right,
      y: e.clientY - rect.bottom
    });
    e.preventDefault();
    e.stopPropagation();
  };

  // 마우스 이동 이벤트 (드래그 중)
  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 내에서만 이동
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      const newPosition = { x: clampedX, y: clampedY };
      setPosition(newPosition);
      savePosition(newPosition);
    } else if (isResizing) {
      const newWidth = e.clientX - position.x + Math.abs(resizeOffset.x);
      const newHeight = e.clientY - position.y + Math.abs(resizeOffset.y);
      
      // 최소/최대 크기 제한
      const minWidth = 300;
      const minHeight = 400;
      const maxWidth = window.innerWidth - position.x - 20;
      const maxHeight = window.innerHeight - position.y - 20;
      
      const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      const clampedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      
      const newSize = { width: clampedWidth, height: clampedHeight };
      setSize(newSize);
      saveSize(newSize);
    }
  };

  // 마우스 업 이벤트 (드래그/리사이즈 종료)
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // 터치 이벤트 지원
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
      return;
    }
    
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;

    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    const newPosition = { x: clampedX, y: clampedY };
    setPosition(newPosition);
    savePosition(newPosition);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 전역 마우스/터치 이벤트 리스너
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeOffset, size, position]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      type: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // AI 응답 요청
      const response = await callChatAPI(inputMessage);
      const assistantMessage = {
        id: Date.now() + 1,
        content: response,
        type: 'assistant',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('채팅 API 오류:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        type: 'assistant',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const callChatAPI = async (message) => {
    try {
      // 사용자 프로필에서 API 키 가져오기
      const userProfile = getUserProfile();
      if (!userProfile.openai_api_key || !validateApiKey(userProfile.openai_api_key)) {
        throw new Error('OpenAI API 키가 설정되지 않았거나 유효하지 않습니다. 내 정보에서 API 키를 설정해주세요.');
      }
      
      const response = await fetch(WEB_API.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message,
          apiKey: userProfile.openai_api_key
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
      }
      
    } catch (error) {
      console.error('API 호출 오류:', error);
      
      // 오프라인 모드: 간단한 응답 생성
      return generateOfflineResponse(message);
    }
  };

  const generateOfflineResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('보고서') || lowerMessage.includes('작성')) {
      return `📋 안전보고서 작성 가이드:\n\n1. 현장 정보 수집\n2. 위험요소 식별\n3. 안전조치 사항 기록\n4. 점검 결과 문서화\n5. 개선사항 제안\n\n더 자세한 도움이 필요하시면 템플릿 관리 메뉴를 확인해보세요!`;
    }
    
    if (lowerMessage.includes('법') || lowerMessage.includes('규정')) {
      return `⚖️ 산업안전보건법 주요 사항:\n\n• 사업주의 안전보건 의무\n• 근로자의 안전보건 준수사항\n• 위험성평가 실시 의무\n• 안전교육 실시 의무\n• 사고발생시 보고 의무\n\n구체적인 법령은 고용노동부 홈페이지에서 확인하실 수 있습니다.`;
    }
    
    if (lowerMessage.includes('위험') || lowerMessage.includes('평가')) {
      return `🔍 위험성평가 절차:\n\n1단계: 위험요인 파악\n2단계: 위험성 추정\n3단계: 위험성 결정\n4단계: 위험성 감소대책 수립\n5단계: 기록 및 관리\n\n각 단계별 세부 방법론은 안전보건공단 가이드라인을 참조하세요.`;
    }
    
    return `🤖 현재 오프라인 모드로 작동 중입니다.\n\n다음과 같은 주제로 질문해보세요:\n• 안전보고서 작성 방법\n• 산업안전보건법 관련 사항\n• 위험성평가 절차\n• 안전사고 대응 방법\n\n더 정확한 답변을 위해서는 서버 연결이 필요합니다.`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Paper
      ref={chatRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      elevation={8}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        borderRadius: 3,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
      }}
    >
      {/* 헤더 */}
      <Box sx={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        pb: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '1px'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon />
          <Typography variant="h6" component="div">
            AI 어시스턴트
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, ml: 1 }}>
            (드래그하여 이동 • {size.width}×{size.height})
          </Typography>
        </Box>
        <Box>
          <IconButton
            onClick={onClose}
            sx={{ color: 'primary.contrastText' }}
            size="small"
          >
            <MinimizeIcon />
          </IconButton>
          <IconButton
            onClick={onClose}
            sx={{ color: 'primary.contrastText' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* 메시지 영역 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, maxHeight: size.height - 200 }}>
        <List sx={{ p: 0 }}>
          {safeMessages.map((message, index) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: 'column',
                alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                py: 1,
                px: 0
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '85%',
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                  }}
                >
                  {message.type === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                
                <Card
                  sx={{
                    bgcolor: message.type === 'user' ? 'primary.light' : 'grey.100',
                    color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                    boxShadow: 1
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.875rem'
                      }}
                    >
                      {message.content}
                    </Typography>
                    {message.timestamp && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          display: 'block',
                          opacity: 0.7,
                          fontSize: '0.75rem'
                        }}
                      >
                        {message.timestamp}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </ListItem>
          ))}
          
          {isLoading && (
            <ListItem sx={{ justifyContent: 'flex-start', px: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                  <BotIcon />
                </Avatar>
                <Card sx={{ bgcolor: 'grey.100', boxShadow: 1 }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2">
                      💭 생각 중...
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>
      
      {/* 입력 영역 */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          color="primary"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            '&.Mui-disabled': {
              bgcolor: 'grey.300'
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* 리사이즈 핸들 */}
      <Box
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          cursor: 'nw-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'grey.500',
          '&:hover': {
            color: 'primary.main',
          },
          '&::before': {
            content: '""',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 0 8px 8px',
            borderColor: 'transparent transparent currentColor transparent',
            transform: 'rotate(45deg)',
          }
        }}
      />
    </Paper>
  );
}

export default Chatbot;