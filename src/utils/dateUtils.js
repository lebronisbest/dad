// 한국 시간대(Asia/Seoul) 기준 날짜 유틸리티

/**
 * 한국 시간대 기준으로 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
 */
export const getKoreanDate = () => {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreanTime.toISOString().split('T')[0];
};

/**
 * 한국 시간대 기준으로 현재 시간을 HH:MM 형식으로 반환
 * @returns {string} HH:MM 형식의 시간 문자열
 */
export const getKoreanTime = () => {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreanTime.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};

/**
 * 한국 시간대 기준으로 현재 날짜와 시간을 객체로 반환
 * @returns {object} { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
export const getKoreanDateTime = () => {
  return {
    date: getKoreanDate(),
    time: getKoreanTime()
  };
};
