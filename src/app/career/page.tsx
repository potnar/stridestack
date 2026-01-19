'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, BrainCircuit, Play, Loader2, ArrowRight, RefreshCcw } from "lucide-react";
import { generateQuizQuestions } from '@/app/actions';
import { cn } from '@/lib/utils';

// Duplicate interface here or export shared type
interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export default function CareerPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const startQuiz = async () => {
    setStatus('loading');
    try {
      const qs = await generateQuizQuestions();
      setQuestions(qs);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setStatus('playing');
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent changing answer
    setSelectedAnswer(index);
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
    } else {
      setStatus('finished');
    }
  };

  return (
    <div className="p-4 space-y-6 min-h-[calc(100vh-80px)] flex flex-col">
      <header className="pt-8 pb-4">
        <h1 className="text-3xl font-bold">Career AI</h1>
        <p className="text-zinc-400">Fullstack Mock Interview</p>
      </header>

      {/* IDLE STATE */}
      {status === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4">
            <BrainCircuit size={48} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Ready for a challenge?</h3>
            <p className="text-zinc-400 max-w-xs mx-auto">
              Test your knowledge in Node.js, React, Next.js, and Postgres with AI-generated questions.
            </p>
          </div>
          <button 
            onClick={startQuiz}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Play size={24} fill="currentColor" />
            Start Interview
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {status === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 size={48} className="animate-spin text-blue-500" />
          <p className="text-zinc-400 animate-pulse">Generating interview questions...</p>
        </div>
      )}

      {/* PLAYING STATE */}
      {status === 'playing' && questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-sm font-medium text-zinc-500">
            <span>Question {currentQuestion + 1}/{questions.length}</span>
            <span>Score: {score}</span>
          </div>

          <div className="bg-card p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-semibold leading-relaxed">
              {questions[currentQuestion].text}
            </h3>
          </div>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === questions[currentQuestion].correctAnswer;
              const showResult = selectedAnswer !== null;

              let style = "bg-card border-transparent hover:bg-zinc-800";
              if (showResult) {
                if (isCorrect) style = "bg-green-500/20 border-green-500 text-green-500";
                else if (isSelected) style = "bg-red-500/20 border-red-500 text-red-500";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all text-sm sm:text-base font-medium",
                    style,
                    isSelected && !showResult && "ring-2 ring-blue-500"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="animate-in slide-in-from-bottom-2 fade-in">
              <div className="bg-blue-500/10 p-4 rounded-xl mb-4 text-sm text-blue-200">
                <p className="font-bold mb-1">Explanation:</p>
                {questions[currentQuestion].explanation}
              </div>
              <button 
                onClick={nextQuestion}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Next Question <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* FINISHED STATE */}
      {status === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-2">
            <p className="text-zinc-400">Interview Complete</p>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600">
              {Math.round((score / questions.length) * 100)}%
            </h2>
            <p className="text-xl font-medium">
              You scored {score} out of {questions.length}
            </p>
          </div>

          <button 
            onClick={startQuiz}
            className="flex items-center gap-2 bg-zinc-800 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-700 active:scale-95 transition-all"
          >
            <RefreshCcw size={20} />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
