import React, { useState, useRef, useEffect } from 'react';
import { Fab, Badge, Tooltip } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';
import Chatbot from './Chatbot';

function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('FloatingChatbot 컴포넌트가 마운트되었습니다.');
  }, []);

  const handleToggle = () => {
    console.log('챗봇 토글:', !isOpen);
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  console.log('FloatingChatbot 렌더링, isOpen:', isOpen);

  return (
    <>
      <Tooltip title="🤖 AI 챗봇과 대화하기" placement="left">
        <Fab
          color="primary"
          aria-label="chatbot"
          onClick={handleToggle}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            boxShadow: 3,
            transition: 'all 0.2s ease-in-out',
            // 파란색 그라데이션 배경
            background: 'linear-gradient(45deg, #4F46E5, #7C3AED)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6366F1, #8B5CF6)',
              boxShadow: 6,
              transform: 'scale(1.05)',
            },
          }}
        >
          <Badge
            color="error"
            variant="dot"
            invisible={!hasNewMessage}
            sx={{
              '& .MuiBadge-dot': {
                top: 8,
                right: 8,
              }
            }}
          >
            <BotIcon sx={{ fontSize: 28, color: 'white' }} />
          </Badge>
        </Fab>
      </Tooltip>
      
      <Chatbot isOpen={isOpen} onClose={handleClose} />
    </>
  );
}

export default FloatingChatbot;
