import React, { useState, useEffect, forwardRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Loader2, Calendar, Check, Trophy, Flame, BarChart3, Sparkles, Award } from 'lucide-react';

// --- 유틸리티 ---
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// --- 데이터 세팅 ---
const MEETING_DATES = [
  '3/8', '3/15', '3/22', 
  '4/12', '4/19', 
  '5/10', '5/17', '5/24', 
  '6/14', '6/21'
];

const INITIAL_NAMES = [
  "배다희", "손여원", "김태린", "현요섭", "김승우", 
  "이은총", "조영광", "문하은", "최예인", "로이", 
  "서다현", "사예한", "이다율", "방태산", "이은서", 
  "민유진", "이태은", "허진주", "오나윤", "시온"
];

const PRAISE_MESSAGES = [
  "오늘도 자리를 지켜주어 고마워! ✨",
  "너의 은사가 가장 빛나는 하루야! 🌟",
  "신실한 발걸음을 주님이 크게 기뻐하셔! 🕊️",
  "함께 예배하고 섬길 수 있어서 든든해! 💪",
  "오늘 흘려보낸 은혜가 누군가를 살릴 거야! 🌱",
  "수고했어! 주님이 너의 섬김을 다 아셔! 🤍",
  "네가 있어서 우리 팀이 훨씬 따뜻해져! ☀️",
  "최고야! 오늘도 영적 배짱 든든히 챙겼네! 🔥"
];

// --- Types ---
interface TextRotateProps {
  texts: string[];
  transition?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  [key: string]: any;
}

// --- TextRotate 컴포넌트 (세련된 애니메이션 헤더용) ---
const TextRotate = forwardRef<HTMLSpanElement, TextRotateProps>((
  {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    rotationInterval = 2500,
    staggerDuration = 0.025,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...props
  },
  ref
) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = (text: string) => {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), ({ segment }) => segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === "characters") {
      const text = currentText.split(" ");
      return text.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== text.length - 1,
      }));
    }
    // For other split types, we might need a different approach, 
    // but for this specific component usage, 'characters' is the default and used one.
    // Fallback for simple split if needed:
    return [{ characters: [currentText], needsSpace: false }]; 
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback((index: number, totalChars: number) => {
    const total = totalChars;
    if (staggerFrom === "first") return index * staggerDuration;
    if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
    if (staggerFrom === "center") {
      const center = Math.floor(total / 2);
      // @ts-ignore
      return Math.abs(center - index) * staggerDuration;
    }
    // @ts-ignore
    return index * staggerDuration;
  }, [staggerFrom, staggerDuration]);

  const next = useCallback(() => {
    setCurrentTextIndex((prev) => (prev === texts.length - 1 ? (loop ? 0 : prev) : prev + 1));
  }, [texts.length, loop]);

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  return (
    <motion.span className={cn("flex flex-wrap whitespace-pre-wrap", mainClassName)} {...props} layout transition={transition} ref={ref}>
      <span className="sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode="wait">
        <motion.div key={currentTextIndex} className="flex flex-wrap" layout aria-hidden="true">
          {elements.map((wordObj, wordIndex, array) => {
            const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
            return (
              <span key={wordIndex} className={cn("inline-flex", splitLevelClassName)}>
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(previousCharsCount + charIndex, array.reduce((sum, word) => sum + word.characters.length, 0)),
                    }}
                    className={cn("inline-block", elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.span>
  );
});

TextRotate.displayName = "TextRotate";

// --- 정중앙 토스트 (칭찬 메시지) ---
const CenterToast = ({ message, visible }: { message: string; visible: boolean }) => {
  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-slate-900/90 backdrop-blur-2xl text-white px-8 py-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 border border-white/10 max-w-sm w-full text-center pointer-events-auto"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/30">
              <Sparkles size={32} className="text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold leading-tight break-keep">{message}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface Student {
  id: string;
  name: string;
  attendance: number[];
}

// --- 인트로 화면 컴포넌트 ---
const IntroScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-4 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 blur-3xl opacity-30 rounded-full" />
          <Sparkles size={64} className="text-orange-400 relative z-10" />
        </motion.div>

        <motion.h1 
          className="text-4xl md:text-6xl font-black tracking-tighter mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          은사팀 출석부
        </motion.h1>

        <motion.p 
          className="text-lg md:text-xl text-slate-400 font-medium mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          우리의 신실한 발걸음을 기록합니다
        </motion.p>

        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg tracking-wide overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            시작하기 <Check size={20} />
          </span>
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-orange-200 to-rose-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </motion.button>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/5 rounded-full blur-3xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

import { supabase } from './lib/supabase';

// ... (previous imports and constants)

// --- 메인 앱 컴포넌트 ---
export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [activeView, setActiveView] = useState('list');
  const [toastMessage, setToastMessage] = useState({ text: '', visible: false });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage({ text, visible: true });
    setTimeout(() => setToastMessage({ text: '', visible: false }), 3000);
  };

  // Initial Data Load from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setError(null);
        
        // 1. Fetch Students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true });

        if (studentsError) throw studentsError;

        // 2. Fetch Attendance
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*');

        if (attendanceError) throw attendanceError;

        // 3. Merge Data
        const mergedData = studentsData.map((s: any) => {
          const studentAttendance = new Array(MEETING_DATES.length).fill(0);
          attendanceData
            .filter((a: any) => a.student_id === s.id)
            .forEach((a: any) => {
              if (a.date_index < MEETING_DATES.length) {
                studentAttendance[a.date_index] = a.status;
              }
            });
          
          return {
            id: String(s.id),
            name: s.name,
            attendance: studentAttendance
          };
        });

        // Ensure client-side sorting just in case
        const sortedData = mergedData.sort((a: Student, b: Student) => a.name.localeCompare(b.name, 'ko'));
        setStudents(sortedData);
        setIsConnected(true);
      } catch (error: any) {
        console.error("Failed to load students:", error);
        setError("데이터 로딩 실패. Supabase 설정을 확인해주세요.");
        setIsConnected(false);
        
        // Fallback to local data if API fails
        const initialList = INITIAL_NAMES.map((name, index) => ({
          id: String(index + 1),
          name,
          attendance: new Array(MEETING_DATES.length).fill(0),
        })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        setStudents(initialList);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('attendance_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('Realtime update:', payload);
          const newRecord = payload.new as any;
          
          if (newRecord && newRecord.student_id !== undefined) {
             setStudents(prevStudents => prevStudents.map(student => {
              if (student.id === String(newRecord.student_id)) {
                const newAttendance = [...student.attendance];
                // Ensure date_index is valid
                if (newRecord.date_index < newAttendance.length) {
                    newAttendance[newRecord.date_index] = newRecord.status;
                }
                return { ...student, attendance: newAttendance };
              }
              return student;
            }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleAttendance = async (studentId: string, dateIndex: number) => {
    // Optimistic Update
    let studentName = "";
    let isNowChecked = false;

    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        studentName = student.name;
        const newAttendance = [...student.attendance];
        const newStatus = 1 - newAttendance[dateIndex];
        newAttendance[dateIndex] = newStatus;
        isNowChecked = newStatus === 1;
        return { ...student, attendance: newAttendance };
      }
      return student;
    }));

    if (isNowChecked) {
      const randomPraise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      showToast(`${studentName}, ${randomPraise}`);
    }

    try {
      // Upsert to Supabase
      // We need to find the current status to toggle it properly in DB or just send the new status
      // Since we did optimistic update, we know the new status is 1 or 0.
      // But wait, we need to know the *new* status to send.
      // Let's re-calculate it or just use the optimistic value.
      
      const currentStudent = students.find(s => s.id === studentId);
      const currentStatus = currentStudent?.attendance[dateIndex] || 0;
      const newStatus = 1 - currentStatus; // This is what we *want* to set it to.

      const { error } = await supabase
        .from('attendance')
        .upsert({ 
            student_id: Number(studentId), 
            date_index: dateIndex, 
            status: newStatus 
        }, { onConflict: 'student_id,date_index' });

      if (error) throw error;
      
    } catch (error) {
      console.error("Failed to toggle attendance:", error);
      // Revert logic could go here
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-slate-800" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroScreen onStart={() => setShowIntro(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f4f5f7] text-slate-900 font-sans pb-16 selection:bg-orange-200">
      <div className="max-w-7xl mx-auto p-4 md:p-8 md:pt-16">
        
        {/* 세련된 미니멀 헤더 */}
        <header className="mb-16 text-center md:text-left md:flex justify-between items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold tracking-widest text-slate-500 mb-6 uppercase">
              <Calendar size={12} />
              Spring & Summer 2026
              <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {error && <span className="text-red-500 normal-case tracking-normal ml-1">{error}</span>}
            </div>
            <LayoutGroup>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 flex flex-wrap items-center justify-center md:justify-start gap-3">
                은사팀의
                <TextRotate
                  texts={["빛나는", "따뜻한", "신실한", "즐거운"]}
                  mainClassName="text-white px-4 py-1 bg-gradient-to-r from-[#ff5941] to-[#ff3b7c] overflow-hidden rounded-2xl"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.03}
                />
                상반기
              </h1>
            </LayoutGroup>
            <p className="mt-4 text-lg text-slate-500 font-medium">
              총 10번의 주일 모임, 우리의 성장이 기록되는 공간
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mt-8 md:mt-0 flex bg-white rounded-full p-1.5 shadow-sm border border-slate-200 w-fit mx-auto md:mx-0">
            {['list', 'stats'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeView === view ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {activeView === view && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-slate-900 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                <div className="flex items-center gap-2">
                  {view === 'list' ? <Check size={16} /> : <BarChart3 size={16} />}
                  {view === 'list' ? '출석 체크' : '성장 통계'}
                </div>
              </button>
            ))}
          </div>
        </header>

        {/* 메인 뷰 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'list' ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
              >
                {students.map((student) => (
                  <StudentCard 
                    key={student.id} 
                    student={student} 
                    dates={MEETING_DATES}
                    onToggle={handleToggleAttendance} 
                  />
                ))}
              </motion.div>
            ) : (
              <StatisticsView students={students} dates={MEETING_DATES} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <CenterToast message={toastMessage.text} visible={toastMessage.visible} />
      </div>
    </>
  );
}

// --- 학생 카드 컴포넌트 (미니멀 & 타이포그래피 중심) ---
const StudentCard = ({ student, dates, onToggle }: { student: Student; dates: string[]; onToggle: (id: string, index: number) => void }) => {
  const attendedCount = student.attendance.filter(v => v === 1).length;
  const totalCount = dates.length;
  const attendanceRate = Math.round((attendedCount / totalCount) * 100);

  const isPerfect = attendanceRate === 100;
  const isGood = attendanceRate >= 50 && !isPerfect;

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-full group"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {student.name}
            {isPerfect && <Trophy size={20} className="text-[#ff5941]" />}
            {isGood && <Flame size={20} className="text-orange-400" />}
          </h3>
          <p className="text-sm font-bold text-slate-400 mt-1">
            출석 {attendedCount} / {totalCount}
          </p>
        </div>
        
        <div className="text-right">
          <span className={`text-3xl font-black tracking-tighter ${attendanceRate === 100 ? 'text-[#ff5941]' : 'text-slate-200'}`}>
            {attendanceRate}<span className="text-lg">%</span>
          </span>
        </div>
      </div>

      {/* 미니멀한 출석 버튼 그리드 */}
      <div className="grid grid-cols-5 gap-y-6 gap-x-2 mt-auto pt-4 border-t border-slate-50">
        {dates.map((date, index) => {
          const isAttended = student.attendance[index] === 1;
          
          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <span className={`text-[10px] font-bold ${isAttended ? 'text-slate-800' : 'text-slate-300'}`}>
                {date}
              </span>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggle(student.id, index)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isAttended 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                }`}
              >
                {isAttended && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="absolute inset-0 bg-[#ff5941] rounded-full -z-10 scale-110 opacity-20" 
                  />
                )}
                {isAttended && <Check size={14} strokeWidth={4} />}
              </motion.button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// --- 통계 뷰 컴포넌트 ---
const StatisticsView = ({ students, dates }: { students: Student[]; dates: string[] }) => {
  const studentStats = students.map(student => {
    const count = student.attendance.filter(v => v === 1).length;
    const rate = Math.round((count / dates.length) * 100);
    return { ...student, count, rate };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">팀원별 은혜의 온도</h3>
            <p className="text-slate-500 font-medium mt-1">출석률 기반 통계 현황</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          {studentStats.map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              key={i} 
              className="flex flex-col gap-2 group"
            >
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-slate-800">{stat.name}</span>
                <span className={`text-sm font-black ${stat.rate === 100 ? 'text-[#ff5941]' : 'text-slate-400'}`}>
                  {stat.rate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.rate}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                  className={`h-full rounded-full ${
                    stat.rate === 100 ? 'bg-gradient-to-r from-[#ff5941] to-[#ff3b7c]' : 'bg-slate-900'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
