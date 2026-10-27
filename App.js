import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StatusBar, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SERVER_URL } from './config';

const C = { bg:'#100f19', panel:'#201d2c', gold:'#e8bd71', cream:'#f4e9d7', muted:'#b7adbd', border:'#53435b', red:'#c96c76' };
const SUSPECTS = ['Eleanor Blackwood','Thomas Blackwood','Mr. Graves','Vivian Sterling'];
const WEAPONS = ['Nightshade extract','Letter opener','Rope','Candlestick'];
const wsAddress = () => SERVER_URL.replace(/^http/,'ws').replace(/\/$/,'') + '/ws';

function Button({title,onPress,disabled=false,secondary=false}) {return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,secondary&&styles.secondary,disabled&&{opacity:.4}]}><Text style={[styles.buttonText,secondary&&{color:C.gold}]}>{title}</Text></Pressable>}
function Pick({items,value,onPick}) {return <View style={{gap:8}}>{items.map(item=><Pressable key={item} onPress={()=>onPick(item)} style={[styles.option,value===item&&styles.selected]}><Text style={{color:value===item?C.bg:C.cream,fontSize:15}}>{value===item?'●  ':'○  '}{item}</Text></Pressable>)}</View>}
function Panel({title,children}) {return <View style={styles.panel}>{title?<Text style={styles.panelTitle}>{title}</Text>:null}{children}</View>}

export default function App(){
 const ws=useRef(null), reconnecting=useRef(false);
 const [name,setName]=useState(''),[code,setCode]=useState(''),[room,setRoom]=useState(null),[id,setId]=useState(null),[error,setError]=useState(''),[status,setStatus]=useState('Not connected'),[answer,setAnswer]=useState(''),[suspect,setSuspect]=useState(''),[weapon,setWeapon]=useState(''),[voted,setVoted]=useState(false);
 const send=(action,fields={})=>{if(ws.current?.readyState===WebSocket.OPEN)ws.current.send(JSON.stringify({action,...fields}));else setError('Connection lost. Return to the lobby and reconnect.');};
 const connect=(action)=>{
  if(!name.trim()){setError('Enter your detective name.');return;}
  if(action==='join'&&!code.trim()){setError('Enter the room code.');return;}
  if(SERVER_URL.includes('YOUR-SERVER-HOST')){setError('Setup needed: set your deployed server URL in config.js first.');return;}
  ws.current?.close();setRoom(null);setId(null);setError('');setStatus('Connecting…');
  const socket=new WebSocket(wsAddress());ws.current=socket;
  socket.onopen=()=>{setStatus('Connected');socket.send(JSON.stringify({action,name:name.trim(),code:code.trim().toUpperCase()}));};
  socket.onmessage=(e)=>{try{const m=JSON.parse(e.data);if(m.type==='identity')setId(m.id);if(m.type==='state'){setRoom(old=>{if(old?.puzzle!==m.puzzle){setAnswer('');setSuspect('');setWeapon('');}return m;});setCode(m.code);setVoted(false);}if(m.type==='error')setError(m.message);}catch(_){setError('Received an invalid server response.');}};
  socket.onerror=()=>setError('Unable to connect to the game server.');
  socket.onclose=()=>setStatus('Disconnected');
 };
 useEffect(()=>()=>ws.current?.close(),[]);
 const leave=()=>{ws.current?.close();ws.current=null;setRoom(null);setId(null);setStatus('Not connected');setError('');};
 const isHost=room?.host===id, current=room?.puzzles?.[room.puzzle], alreadyVoted=!!room?.votes?.[id];
 return <SafeAreaView style={styles.root}><StatusBar barStyle="light-content"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
 <Text style={styles.kicker}>A MULTIPLAYER MURDER MYSTERY</Text><Text style={styles.title}>MURDER AT{ '\n'}MIDNIGHT MANOR</Text><Text style={styles.subtitle}>One mansion. Four suspects. One killer.</Text>
 {!room?<> 
 <Panel title="Enter the Manor"><Text style={styles.label}>Detective name</Text><TextInput style={styles.input} placeholder="Your name" placeholderTextColor={C.muted} value={name} maxLength={24} onChangeText={setName}/><Button title="Create Private Room" onPress={()=>connect('create')}/><Text style={styles.label}>Or join your friends</Text><TextInput style={styles.input} placeholder="5-character room code" placeholderTextColor={C.muted} autoCapitalize="characters" maxLength={5} value={code} onChangeText={setCode}/><Button title="Join Room" secondary onPress={()=>connect('join')}/></Panel>
 <Text style={styles.note}>2–6 players • Play together online • Everyone uses their own device</Text></>:
 <> 
 <Panel title={'ROOM  '+room.code}><Text style={styles.note}>Share this code with friends. Status: {status}</Text><Text style={styles.note}>Players ({room.players.length}/6): {room.players.map(p=>`${p.name}${p.id===room.host?' ★':''}${p.online?'':' (offline)'}`).join(', ')}</Text><Button title="Leave Room" secondary onPress={leave}/></Panel>
 {room.phase==='lobby'&&<Panel title="The Invitation"><Text style={styles.body}>Edward Blackwood is dead. At midnight, the manor doors lock. Work together to investigate five rooms and discover the murderer.</Text><Text style={styles.note}>{isHost?'You are the host. Start when everyone has joined.':'Waiting for the host to start the investigation.'}</Text>{isHost&&<Button title="Start Investigation" disabled={room.players.length<2} onPress={()=>send('start')}/>}</Panel>}
 {room.phase==='playing'&&current&&<>
 <Panel title={`PUZZLE ${room.puzzle+1} OF ${room.puzzles.length}: ${current.title}`}><Text style={styles.body}>{current.story}</Text>{current.type==='choice'?<Pick items={current.options} value={answer} onPick={setAnswer}/>:<TextInput style={styles.input} placeholder={current.placeholder||'Your answer'} placeholderTextColor={C.muted} value={answer} onChangeText={setAnswer} autoCapitalize="characters"/>}<Button title="Submit Answer" disabled={!answer.trim()} onPress={()=>{setError('');send('solve',{answer});}}/><Button title="Reveal Hint" secondary onPress={()=>send('hint')}/>{room.hints.includes(room.puzzle)&&<Text style={styles.hint}>HINT: {current.hint}</Text>}</Panel>
 <Panel title="Shared Evidence">{room.evidence.length?room.evidence.map((item,i)=><Text key={i} style={styles.evidence}>{i+1}. {item}</Text>):<Text style={styles.note}>Solve puzzles to uncover evidence.</Text>}</Panel>
 </>}
 {room.phase==='voting'&&<><Panel title="FINAL ACCUSATION"><Text style={styles.body}>All five puzzles are solved. Each detective must vote for the murderer and the murder weapon. The verdict appears after all connected players have voted.</Text><Text style={styles.label}>Who committed the murder?</Text><Pick items={SUSPECTS} value={suspect} onPick={setSuspect}/><Text style={styles.label}>Which weapon was used?</Text><Pick items={WEAPONS} value={weapon} onPick={setWeapon}/><Button title={alreadyVoted?'Vote Submitted':'Cast Final Vote'} disabled={alreadyVoted||!suspect||!weapon} onPress={()=>send('vote',{suspect,weapon})}/><Text style={styles.note}>{Object.keys(room.votes).length} vote(s) submitted</Text></Panel><Panel title="Case File">{room.evidence.map((item,i)=><Text key={i} style={styles.evidence}>{i+1}. {item}</Text>)}</Panel></>}
 {room.phase==='finished'&&<Panel title={room.result?.success?'CASE SOLVED — YOU ESCAPED!':'THE MANOR KEEPS ITS SECRETS'}><Text style={styles.body}>{room.result?.summary}</Text><Text style={styles.evidence}>Murderer: {room.result?.suspect}</Text><Text style={styles.evidence}>Weapon: {room.result?.weapon}</Text>{isHost&&<Button title="Play Again" onPress={()=>send('restart')}/>}</Panel>}
 {room.messages?.length>0&&<Panel title="Investigation Log">{room.messages.slice(-6).map((m,i)=><Text style={styles.note} key={i}>• {m}</Text>)}</Panel>}
 </>}
 {!!error&&<View style={styles.error}><Text style={{color:'#ffd9d9'}}>{error}</Text><Pressable onPress={()=>setError('')}><Text style={{color:C.gold,marginTop:6}}>Dismiss</Text></Pressable></View>}
 <Text style={styles.footer}>MIDNIGHT MANOR • PRIVATE DETECTIVE ROOMS</Text>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:C.bg},content:{padding:20,paddingBottom:55,gap:16},kicker:{color:C.gold,fontSize:11,letterSpacing:3,textAlign:'center',marginTop:20},title:{color:C.gold,fontSize:29,fontWeight:'900',letterSpacing:1,textAlign:'center',lineHeight:36},subtitle:{color:C.muted,textAlign:'center',marginBottom:8,fontStyle:'italic'},panel:{backgroundColor:C.panel,borderColor:C.border,borderWidth:1,borderRadius:14,padding:18,gap:13},panelTitle:{color:C.gold,fontSize:19,fontWeight:'bold'},body:{color:C.cream,fontSize:16,lineHeight:25},label:{color:C.cream,fontSize:14,fontWeight:'600',marginTop:4},input:{color:C.cream,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:8,padding:14,fontSize:16},button:{backgroundColor:C.gold,borderRadius:9,padding:15,alignItems:'center',marginTop:3},secondary:{backgroundColor:'transparent',borderWidth:1,borderColor:C.gold},buttonText:{color:C.bg,fontWeight:'800',fontSize:15},option:{borderWidth:1,borderColor:C.border,borderRadius:9,padding:13,backgroundColor:C.bg},selected:{backgroundColor:C.gold,borderColor:C.gold},note:{color:C.muted,fontSize:13,lineHeight:21},hint:{color:C.gold,lineHeight:22},evidence:{color:C.cream,lineHeight:23,paddingVertical:4},error:{backgroundColor:'#612f38',padding:14,borderRadius:10},footer:{color:C.muted,textAlign:'center',fontSize:10,letterSpacing:2,marginTop:10}});

