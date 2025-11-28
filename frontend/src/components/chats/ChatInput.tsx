/* ========================
   FULL CHAT INPUT COMPONENT
   WITH AUDIO RECORDING + CLOUD UPLOAD
   ======================== */

import { useState, useRef, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

import {
  Paperclip,
  Smile,
  Mic,
  Send,
  Trash2,
  Pause,
  Play,
  StopCircle,
} from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { uploadFileThunk } from "@/features/message/messageThunks";
import { sendChatPayload } from "@/services/chats/sendChatMessage";

import type { SendMessagePayload, Attachment } from "@/types/socketTypes";

type FormValues = { message: string };

type ChatItemProps = {
  chatType: "group" | "private";
  newChatId: string;
};

export default function ChatInput({ chatType, newChatId }: ChatItemProps) {
  const { id } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  /* ======================
     FORM
  ====================== */
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { message: "" },
  });

  const message = watch("message");

  /* ======================
     MEDIA FILE STATE
  ====================== */
  const [mediaAttachment, setMediaAttachment] = useState<Attachment | null>(
    null
  );

  /* ======================
     AUDIO RECORDING STATES
  ====================== */
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  /* ========== TIMER ========== */
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const pauseTimer = () => timerRef.current && clearInterval(timerRef.current);

  const resetTimer = () => {
    pauseTimer();
    setRecordingTime(0);
  };

  /* ======================
     AUDIO RECORDER REFS
  ====================== */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /* ======================
     WAVEFORM DRAWING (WebAudio API)
  ====================== */
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.fftSize;
    const data = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(data);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = isPaused ? "rgba(255,80,80,0.6)" : "rgba(255,0,0,0.9)";

      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const y = (data[i] / 128) * (canvas.height / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.stroke();
    };

    draw();
  };

  /* ======================
     CLEANUP
  ====================== */
  const cleanupRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    analyserRef.current?.disconnect();
    sourceRef.current?.disconnect();

    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const revokeAudioURL = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
  };

  useEffect(() => {
    return () => cleanupRecording();
  }, []);

  /* ======================
     AUDIO RECORDING LOGIC
  ====================== */
  const getSupportedMime = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t));
  };

  const startRecording = async () => {
    revokeAudioURL();
    resetTimer();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const mime = getSupportedMime()!;
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (e) =>
      e.data.size && chunksRef.current.push(e.data);

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      cleanupRecording();
      resetTimer();
    };

    // WebAudio waveform
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    source.connect(analyser);
    drawWaveform();

    recorder.start();
    startTimer();
    setIsRecording(true);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    pauseTimer();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    startTimer();
    setIsPaused(false);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    pauseTimer();
    setIsRecording(false);
    setIsPaused(false);
  };

  const deleteRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    cleanupRecording();
    resetTimer();
    setAudioBlob(null);
    revokeAudioURL();
    setIsRecording(false);
    setIsPaused(false);
  };

  /* ======================
     FILE UPLOAD (supports audio)
  ====================== */
  const getMediaType = (mime: string): Attachment["type"] => {
    if (mime.startsWith("image")) return "image";
    if (mime.startsWith("video")) return "video";
    if (mime.startsWith("audio")) return "audio";
    return "document";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("type", "chat_media");

      const res = await dispatch(uploadFileThunk(data)).unwrap();

      if (res?.url) {
        setMediaAttachment({
          url: res.url,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          type: getMediaType(file.type),
        });
      }
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ======================
     SEND MESSAGE
  ====================== */
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const text = data.message.trim();
    let finalAttachment = mediaAttachment;

    // upload audio if exists
    if (audioBlob) {
      const fd = new FormData();
      const ext = audioBlob.type.includes("ogg") ? "ogg" : "webm";

      fd.append("file", audioBlob, `voice.${ext}`);
      fd.append("type", "chat_media");

      try {
        const res = await dispatch(uploadFileThunk(fd)).unwrap();
        if (res?.url) {
          finalAttachment = {
            url: res.url,
            filename: `voice.${ext}`,
            size: audioBlob.size,
            mimeType: audioBlob.type,
            type: "audio",
          };
        }
      } catch (error: any) {
        console.error("Audio upload failed", error.message);
      }
    }

    if (!text && !finalAttachment) return;

    const payload: SendMessagePayload = {
      id: id!,
      chatId: newChatId,
      chatType,
      messageType: finalAttachment ? finalAttachment.type : "text",
      content: text || "",
      attachments: finalAttachment ? [finalAttachment] : [],
    };

    sendChatPayload(payload);

    // reset UI
    setValue("message", "");
    setMediaAttachment(null);
    deleteRecording();
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="w-full border-t bg-white px-4 py-3 flex items-center gap-3 relative z-2">
      {/* FILE BUTTON */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileRef.current?.click()}
        className="text-zinc-500"
      >
        <Paperclip size={22} />
      </Button>

      <input
        ref={fileRef}
        hidden
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        onChange={handleFileUpload}
      />

      {/* EMOJI PICKER */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="text-zinc-500">
            <Smile size={22} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <EmojiPicker
            height={320}
            onEmojiClick={(e: EmojiClickData) =>
              setValue("message", (message || "") + e.emoji)
            }
          />
        </PopoverContent>
      </Popover>

      {/* MESSAGE INPUT */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 flex items-center gap-2"
      >
        <Input
          {...register("message")}
          placeholder="Type a message"
          className="rounded-full bg-gray-100 border-none px-4 py-2"
        />

        {/* FILE PREVIEW */}
        {mediaAttachment && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-200 rounded">
              {mediaAttachment.filename}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMediaAttachment(null)}
              className="text-zinc-500"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        )}
      </form>

      {/* ========== AUDIO UI ========== */}
      <div className="flex items-center gap-2">
        {/* Recording waveform + timer */}
        {(isRecording || audioURL) && (
          <div className="flex items-center gap-2">
            {/* RED INDICATOR */}
            <div
              className={`w-3 h-3 rounded-full ${
                isRecording ? "bg-red-500 animate-pulse-fast" : "bg-transparent"
              }`}
            />

            {/* WAVEFORM */}
            {isRecording && (
              <canvas
                ref={canvasRef}
                width={150}
                height={40}
                className="rounded bg-transparent"
              />
            )}

            {/* TIMER */}
            <span className="text-sm text-red-600 font-bold">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {/* Start mic */}
        {!isRecording && !audioURL && (
          <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="text-zinc-500"
          >
            <Mic size={20} />
          </Button>
        )}

        {/* Recording controls */}
        {isRecording && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="text-zinc-500"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={stopRecording}
              className="text-zinc-500"
            >
              <StopCircle size={20} />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={deleteRecording}
              className="text-zinc-500"
            >
              <Trash2 size={18} />
            </Button>
          </>
        )}

        {/* Audio preview after stop */}
        {!isRecording && audioURL && (
          <div className="flex items-center gap-2">
            <audio controls src={audioURL} className="max-w-xs" />

            <Button
              variant="destructive"
              size="icon"
              onClick={deleteRecording}
              className="text-zinc-500"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        )}

        {/* SEND BUTTON */}
        {(message.trim() || mediaAttachment || audioBlob || audioURL) && (
          <Button
            size="icon"
            onClick={handleSubmit(onSubmit)}
            className="text-zinc-500"
          >
            <Send size={20} />
          </Button>
        )}
      </div>

      {/* Pulse animation */}
      <style jsx>{`
        @keyframes pulse-fast {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.6;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.6s infinite;
        }
      `}</style>
    </div>
  );
}
