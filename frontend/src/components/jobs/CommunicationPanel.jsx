import { MessageCircle, Phone, PhoneOff, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createRealtimeSocket, getMessage, sendMessage } from "../../services/realtimeService";

const CommunicationPanel = ({ jobId, trackingActive = false, onTrackingUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const trackingUpdateRef = useRef(onTrackingUpdate);

  useEffect(() => {
    trackingUpdateRef.current = onTrackingUpdate;
  }, [onTrackingUpdate]);

  useEffect(() => {
    let mounted = true;
    const socket = createRealtimeSocket();
    socketRef.current = socket;

    getMessage(jobId).then((items) => {
      if (mounted) setMessages(items);
    }).catch((loadError) => setError(loadError.message));

    socket.on("connect", () => socket.emit("job:join", jobId));
    socket.on("chat:message", (message) => setMessages((current) => (
      current.some((item) => item._id === message._id) ? current : [...current, message]
    )));
    socket.on("tracking:location", (update) => trackingUpdateRef.current?.(update));
    socket.on("call:answer", async ({ answer }) => {
      await peerRef.current?.setRemoteDescription(answer);
    });
    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (candidate) await peerRef.current?.addIceCandidate(candidate);
    });
    socket.on("call:end", stopCall);
    socket.on("call:offer", async ({ offer, from }) => {
      const peer = createPeer();
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("call:answer", { jobId, answer, to: from });
      setCalling(true);
    });

    return () => {
      mounted = false;
      socket.disconnect();
      stopCall();
    };
  }, [jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createPeer = () => {
    const peer = new RTCPeerConnection();
    peerRef.current = peer;
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current?.emit("call:ice-candidate", { jobId, candidate });
    };
    peer.ontrack = ({ streams }) => {
      const audio = new Audio();
      audio.srcObject = streams[0];
      audio.play().catch(() => {});
    };
    streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
    return peer;
  };

  async function startCall() {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const peer = createPeer();
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current.emit("call:offer", { jobId, offer });
      setCalling(true);
    } catch (callError) {
      setError(callError.message || "Microphone permission is required");
    }
  }

  function stopCall() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    streamRef.current = null;
    peerRef.current = null;
    setCalling(false);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      const message = await sendMessage(jobId, text);
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
    } catch (sendError) {
      setError(sendError.message);
    }
  };

  return (
    <section className="job-details-card communication-panel">
      <div className="section-title-row">
        <h3><MessageCircle size={18} /> Communication</h3>
        {trackingActive && <span className="status-pill success">Live tracking</span>}
      </div>
      {error && <p className="job-action-message error">{error}</p>}
      <div className="chat-messages">
        {messages.length === 0 && <p className="empty-state-text">No messages yet.</p>}
        {messages.map((message) => <div className="chat-message" key={message._id}><strong>{message.sender?.name || message.senderRole}</strong><span>{message.text}</span></div>)}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-compose" onSubmit={handleSubmit}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" maxLength={2000} />
        <button type="submit" className="icon-button" title="Send message" aria-label="Send message"><Send size={17} /></button>
      </form>
      <button type="button" className="secondary-btn full-width" onClick={calling ? stopCall : startCall}>
        {calling ? <PhoneOff size={17} /> : <Phone size={17} />}
        {calling ? "End call" : "Voice call"}
      </button>
    </section>
  );
};

export default CommunicationPanel;
