// data-server.js — Server-side data module (CommonJS)
// Mirror of data.js used by lib/store.js and all API handlers.
// In production, replace with DB adapter calls (Supabase / Neon).

const ROOMS = [
  // Real rooms from the campus list (single floor)
  { id:'202',  name:'Lecture Theatre 202', floor:1, type:'Lecture Theatre', capacity:60, features:['Biggest room'], bookable:true },
  { id:'204',  name:'Auditorium 204',      floor:1, type:'Auditorium',      capacity:45, features:['Opens into 205'], bookable:true, mergeWith:'205' },
  { id:'205',  name:'Auditorium 205',      floor:1, type:'Auditorium',      capacity:45, features:['Opens into 204'], bookable:true, mergeWith:'204' },
  { id:'209',  name:'Room 209',            floor:1, type:'Lecture Room',    capacity:40, features:[], bookable:true },
  { id:'210',  name:'Room 210',            floor:1, type:'Lecture Room',    capacity:32, features:[], bookable:true },
  { id:'213',  name:'Room 213',            floor:1, type:'Lecture Room',    capacity:50, features:[], bookable:true },
  { id:'214',  name:'Room 214',            floor:1, type:'Lecture Room',    capacity:45, features:[], bookable:true },
  { id:'215',  name:'Room 215',            floor:1, type:'Lecture Room',    capacity:36, features:[], bookable:true },
  { id:'216',  name:'PC Lab 216',          floor:1, type:'PC Lab',          capacity:32, features:[], bookable:true },
  // Faculty offices: staff only, never offered to students
  { id:'206',  name:'Faculty Office 206',  floor:1, type:'Faculty Office',  capacity:0,  features:[], bookable:false, restricted:true },
  { id:'207',  name:'Faculty Office 207',  floor:1, type:'Faculty Office',  capacity:0,  features:[], bookable:false, restricted:true },
  { id:'208',  name:'Faculty Office 208',  floor:1, type:'Faculty Office',  capacity:0,  features:[], bookable:false, restricted:true },
  { id:'211',  name:'Faculty Office 211',  floor:1, type:'Faculty Office',  capacity:0,  features:[], bookable:false, restricted:true },
  // Shared spaces (not bookable)
  { id:'DHL',  name:'DHL Library',         floor:1, type:'Library',         capacity:0,  features:[], bookable:false, publicSpace:true },
  { id:'CAFE', name:'Cafe (Open Space)',   floor:1, type:'Cafe',            capacity:0,  features:[], bookable:false, publicSpace:true },
];

let SCHEDULE = [
  // Monday (day=1)
  {id:1,  day:1,start:'08:30',end:'10:30',roomId:'202',  course:'Business Fundamentals',         code:'BUS101',professor:'Prof. Sarah Mitchell',    program:'BA Business Administration',semester:'Fall 2026'},
  {id:2,  day:1,start:'10:30',end:'12:30',roomId:'213',  course:'Introduction to Marketing',     code:'MKT101',professor:'Dr. Khalid Al-Rashid',    program:'BA Business Administration',semester:'Fall 2026'},
  {id:3,  day:1,start:'11:00',end:'13:00',roomId:'209',  course:'Introduction to Programming',   code:'CS101', professor:'Dr. Elena Vasquez',       program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:4,  day:1,start:'13:00',end:'14:00',roomId:'210',  course:'Academic Writing Workshop',     code:'GEN101',professor:'Dr. Lena Hoffmeister',    program:'All Programs',              semester:'Fall 2026'},
  {id:5,  day:1,start:'14:00',end:'16:00',roomId:'216', course:'Web Development Fundamentals',  code:'CS102', professor:'Dr. Elena Vasquez',       program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:6,  day:1,start:'14:00',end:'16:00',roomId:'214',  course:'Financial Accounting',          code:'FIN101',professor:'Prof. Marcus Klein',      program:'BA Business Administration',semester:'Fall 2026'},
  {id:7,  day:1,start:'16:30',end:'18:30',roomId:'210',  course:'Strategic Management',          code:'MBA501',professor:'Prof. Dr. Anna Hoffmann', program:'MBA',                       semester:'Fall 2026'},
  {id:8,  day:1,start:'18:00',end:'19:30',roomId:'204',   course:'Guest Lecture: Dubai Ecosystem',code:'GEN001',professor:'Industry Speaker',        program:'All Programs',              semester:'Fall 2026'},
  // Tuesday (day=2)
  {id:9,  day:2,start:'09:00',end:'11:00',roomId:'202',  course:'Digital Media Production',      code:'DM101', professor:'Prof. Laura Chen',        program:'BA Digital Media',          semester:'Fall 2026'},
  {id:10, day:2,start:'09:00',end:'11:00',roomId:'209',  course:'Data Structures & Algorithms',  code:'CS201', professor:'Dr. Faisal Qureshi',      program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:11, day:2,start:'11:00',end:'13:00',roomId:'216', course:'UX/UI Design Principles',       code:'DM201', professor:'Prof. Laura Chen',        program:'BA Digital Media',          semester:'Fall 2026'},
  {id:12, day:2,start:'11:00',end:'13:00',roomId:'213',  course:'Organizational Behavior',       code:'BUS201',professor:'Prof. Sarah Mitchell',    program:'BA Business Administration',semester:'Fall 2026'},
  {id:13, day:2,start:'13:30',end:'15:30',roomId:'210',  course:'Statistics for Business',       code:'QM101', professor:'Dr. Priya Patel',         program:'BA Business Administration',semester:'Fall 2026'},
  {id:14, day:2,start:'14:00',end:'16:00',roomId:'216', course:'Machine Learning Foundations',  code:'DS201', professor:'Dr. Priya Patel',         program:'MA Data Science',           semester:'Fall 2026'},
  {id:15, day:2,start:'16:00',end:'17:00',roomId:'210',  course:'Mentoring & Advising Session',  code:'GEN102',professor:'Academic Advisor',        program:'All Programs',              semester:'Fall 2026'},
  {id:16, day:2,start:'17:00',end:'19:00',roomId:'202',  course:'Digital Marketing Strategy',    code:'DM301', professor:'Dr. Khalid Al-Rashid',    program:'MA Digital Marketing',      semester:'Fall 2026'},
  // Wednesday (day=3)
  {id:17, day:3,start:'08:30',end:'10:30',roomId:'209',  course:'Entrepreneurship & Innovation', code:'BUS301',professor:'Prof. Dr. Anna Hoffmann', program:'BA Business Administration',semester:'Fall 2026'},
  {id:18, day:3,start:'09:00',end:'11:00',roomId:'216', course:'Database Management Systems',   code:'CS202', professor:'Dr. Faisal Qureshi',      program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:19, day:3,start:'10:30',end:'12:30',roomId:'202',course:'Visual Communication Design',   code:'DM102', professor:'Prof. Laura Chen',        program:'BA Digital Media',          semester:'Fall 2026'},
  {id:20, day:3,start:'11:00',end:'13:00',roomId:'214',  course:'Corporate Finance',             code:'FIN201',professor:'Prof. Marcus Klein',      program:'BA Business Administration',semester:'Fall 2026'},
  {id:21, day:3,start:'13:00',end:'15:00',roomId:'215',  course:'Human Resource Management',     code:'HRM101',professor:'Prof. Sarah Mitchell',    program:'BA Business Administration',semester:'Fall 2026'},
  {id:22, day:3,start:'14:00',end:'16:00',roomId:'216', course:'AI & Neural Networks',          code:'CS301', professor:'Dr. Elena Vasquez',       program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:23, day:3,start:'16:30',end:'18:30',roomId:'210',  course:'Business Analytics',            code:'MBA502',professor:'Dr. Priya Patel',         program:'MBA',                       semester:'Fall 2026'},
  {id:24, day:3,start:'18:00',end:'20:00',roomId:'209',  course:'Evening MBA: Finance Module',   code:'MBA510',professor:'Prof. Marcus Klein',      program:'MBA',                       semester:'Fall 2026'},
  // Thursday (day=4)
  {id:25, day:4,start:'09:00',end:'11:00',roomId:'202',  course:'Marketing Management',          code:'MKT201',professor:'Dr. Khalid Al-Rashid',    program:'BA Business Administration',semester:'Fall 2026'},
  {id:26, day:4,start:'09:00',end:'11:00',roomId:'216', course:'Data Analytics & Visualization',code:'DS301', professor:'Dr. Priya Patel',         program:'MA Data Science',           semester:'Fall 2026'},
  {id:27, day:4,start:'10:00',end:'12:00',roomId:'215',  course:'Social Media Marketing',        code:'DM202', professor:'Dr. Khalid Al-Rashid',    program:'MA Digital Marketing',      semester:'Fall 2026'},
  {id:28, day:4,start:'11:00',end:'13:00',roomId:'209',  course:'Software Engineering',          code:'CS203', professor:'Dr. Faisal Qureshi',      program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:29, day:4,start:'13:30',end:'15:30',roomId:'216',course:'Motion Graphics & Animation',   code:'DM103', professor:'Prof. Laura Chen',        program:'BA Digital Media',          semester:'Fall 2026'},
  {id:30, day:4,start:'14:00',end:'16:00',roomId:'213',  course:'International Business',        code:'BUS302',professor:'Prof. Dr. Anna Hoffmann', program:'BA Business Administration',semester:'Fall 2026'},
  {id:31, day:4,start:'17:00',end:'19:00',roomId:'202',  course:'Leadership & Management',       code:'MBA503',professor:'Prof. Sarah Mitchell',    program:'MBA',                       semester:'Fall 2026'},
  {id:32, day:4,start:'17:00',end:'19:00',roomId:'204',   course:'Career Fair Prep Seminar',      code:'GEN003',professor:'Career Services Team',    program:'All Programs',              semester:'Fall 2026'},
  // Friday (day=5)
  {id:33, day:5,start:'09:00',end:'11:00',roomId:'216', course:'User Experience Design',        code:'DM204', professor:'Prof. Laura Chen',        program:'BA Digital Media',          semester:'Fall 2026'},
  {id:34, day:5,start:'09:00',end:'11:00',roomId:'214',  course:'Business Ethics & Law',         code:'BUS401',professor:'Prof. Dr. Anna Hoffmann', program:'BA Business Administration',semester:'Fall 2026'},
  {id:35, day:5,start:'10:00',end:'12:00',roomId:'209',  course:'Cloud Computing Fundamentals',  code:'CS302', professor:'Dr. Elena Vasquez',       program:'BA Computer Science & AI',  semester:'Fall 2026'},
  {id:36, day:5,start:'11:00',end:'13:00',roomId:'204',   course:'Weekly Innovation Forum',       code:'GEN002',professor:'Panel Discussion',        program:'All Programs',              semester:'Fall 2026'},
  {id:37, day:5,start:'13:00',end:'15:00',roomId:'216', course:'Natural Language Processing',   code:'DS302', professor:'Dr. Priya Patel',         program:'MA Data Science',           semester:'Fall 2026'},
  {id:38, day:5,start:'14:00',end:'16:00',roomId:'213',  course:'Digital Transformation MBA',    code:'MBA504',professor:'Dr. Faisal Qureshi',      program:'MBA',                       semester:'Fall 2026'},
  {id:39, day:5,start:'16:00',end:'17:30',roomId:'210',  course:'Student Research Presentations',code:'GEN104',professor:'Faculty Panel',           program:'All Programs',              semester:'Fall 2026'},
];

let ANNOUNCEMENTS = [
  {id:1, title:'Campus Closed – UAE National Day', msg:'The campus will be closed on 2–3 December for UAE National Day celebrations.', type:'info', created:'2026-11-10', expires:'2026-12-04'},
  {id:2, title:'Mid-term Exams Schedule', msg:'Mid-term exams run 18–22 November. Check your programme calendar for room assignments.', type:'warning', created:'2026-11-12', expires:'2026-11-23'},
];

let PROFESSORS = [
  {id:1, name:'Prof. Sarah Mitchell',     dept:'Business',   email:'s.mitchell@ue-dubai.ae',   phone:'+971 4 XXX 0001'},
  {id:2, name:'Dr. Khalid Al-Rashid',    dept:'Business',   email:'k.alrashid@ue-dubai.ae',   phone:'+971 4 XXX 0002'},
  {id:3, name:'Dr. Elena Vasquez',       dept:'Technology', email:'e.vasquez@ue-dubai.ae',    phone:'+971 4 XXX 0003'},
  {id:4, name:'Dr. Faisal Qureshi',      dept:'Technology', email:'f.qureshi@ue-dubai.ae',    phone:'+971 4 XXX 0004'},
  {id:5, name:'Dr. Priya Patel',         dept:'Data',       email:'p.patel@ue-dubai.ae',      phone:'+971 4 XXX 0005'},
  {id:6, name:'Prof. Laura Chen',        dept:'Design',     email:'l.chen@ue-dubai.ae',       phone:'+971 4 XXX 0006'},
  {id:7, name:'Prof. Marcus Klein',      dept:'Finance',    email:'m.klein@ue-dubai.ae',      phone:'+971 4 XXX 0007'},
  {id:8, name:'Prof. Dr. Anna Hoffmann', dept:'Business',   email:'a.hoffmann@ue-dubai.ae',   phone:'+971 4 XXX 0008'},
  {id:9, name:'Dr. Lena Hoffmeister',    dept:'General',    email:'l.hoffmeister@ue-dubai.ae', phone:'+971 4 XXX 0009'},
];

module.exports = { ROOMS, SCHEDULE, ANNOUNCEMENTS, PROFESSORS };
