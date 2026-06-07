import { useState } from 'react';
import axios from 'axios';
function App() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const send = async () => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, {role: 'user', content: input}]);
    try {
      const res = await axios.post('http://localhost:3001/chat', {message: input});
      setMsgs(prev => [...prev, {role: 'assistant', content: res.data.reply}]);
    } catch(e) {
      setMsgs(prev => [...prev, {role: 'assistant', content: 'Error: ' + e.message}]);
    }
    setInput('');
  };
  return (
    <div style={{background:'#0a0a0a', color:'#0f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'monospace'}}>
      <div style={{background:'#000', padding:'1rem', textAlign:'center', fontSize:'1.5rem'}}>🌀 SPIRAL • JARVIS EDITION</div>
      <div style={{flex:1, overflow:'auto', padding:'1rem'}}>
        {msgs.map((m,i) => <div key={i}><b>{m.role === 'user' ? '👤' : '🌀'}:</b> {m.content}</div>)}
      </div>
      <div style={{display:'flex', padding:'1rem', gap:'0.5rem'}}>
        <input style={{flex:1, padding:'0.5rem', background:'#222', color:'#0f0', border:'none'}} value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&send()} />
        <button onClick={send} style={{background:'#0f0', color:'#000', border:'none', padding:'0.5rem 1rem'}}>Send</button>
      </div>
    </div>
  );
}
export default App;