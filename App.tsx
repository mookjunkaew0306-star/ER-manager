import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, Users, Bed, FileText, Settings, LogOut, 
  Plus, Trash2, Printer, Save, FileDown, Calendar, Clock,
  AlertCircle, CheckCircle2, ChevronDown, Menu, X, Eye
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// --- Mock Data for Dashboard ---
const mockWeeklyData = [
  { day: 'จ.', admit: 45, discharge: 120, refer: 15 },
  { day: 'อ.', admit: 52, discharge: 110, refer: 12 },
  { day: 'พ.', admit: 38, discharge: 95, refer: 18 },
  { day: 'พฤ.', admit: 65, discharge: 130, refer: 22 },
  { day: 'ศ.', admit: 70, discharge: 145, refer: 25 },
  { day: 'ส.', admit: 85, discharge: 160, refer: 30 },
  { day: 'อา.', admit: 60, discharge: 125, refer: 20 },
];

const mockShiftData = [
  { time: '08:00', patients: 20 },
  { time: '10:00', patients: 45 },
  { time: '12:00', patients: 35 },
  { time: '14:00', patients: 60 },
  { time: '16:00', patients: 50 },
  { time: '18:00', patients: 85 }, // Peak
  { time: '20:00', patients: 70 },
  { time: '22:00', patients: 40 },
];

// --- Reusable UI Components ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, action }) => (
  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
    <div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Input = ({ label, type = 'text', value, onChange, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
      {...props}
    />
  </div>
);

const NumberInput = ({ label, value, onChange, className = '' }) => (
  <Input
    type="number"
    min="0"
    label={label}
    value={value === 0 ? '' : value} // Hide 0 for cleaner fast-entry
    onChange={(e) => {
      const val = e.target.value;
      const num = parseInt(val, 10);
      onChange(isNaN(num) ? 0 : num);
    }}
    onWheel={(e) => e.currentTarget.blur()} // ป้องกันตัวเลขเปลี่ยนเองตอนเลื่อนเมาส์ (Scroll)
    className={className}
    placeholder="0"
    onFocus={(e) => e.target.select()}
  />
);

const Select = ({ label, options, value, onChange, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-8"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
    </div>
  </div>
);

const Button = ({ children, variant = 'primary', onClick, className = '', icon: Icon }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 focus:ring-slate-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('form');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // --- Main Form State ---
  const [formState, setFormState] = useState({
    header: {
      date: new Date().toISOString().split('T')[0],
      shift: 'เช้า', // เช้า, บ่าย, ดึก
      reporter: '',
      supervisor: ''
    },
    stats: {
      carriedOver: 12,
      newPatients: 0,
      discharged: 0,
      referOut: 0,
      death: 0,
      abscond: 0,
      admit: 0,
      level4: 0,
      // Remaining specific breakdowns
      resus: { er: 0, med: 0, ped: 0, gyne: 0, ortho: 0, sx: 0, neuroSx: 0 },
      obsAA: { er: 0, med: 0, ped: 0, gyne: 0, ortho: 0, sx: 0, neuroSx: 0 },
      c0: { er: 0, med: 0, ped: 0, gyne: 0, ortho: 0, sx: 0, neuroSx: 0 }
    },
    indicators: {
      waitAdmitMed: 0, 
      etTube: 0, 
      niv: 0, 
      hfnc: 0, 
      cpr: 0, 
      covid: 0,
      rtafInService: 0, 
      rtafOutOfService: 0, 
      rtafConscript: 0
    },
    staffing: {
      rn: { normal: 0, extra: 0, float: 0 },
      tn: { normal: 0, extra: 0, float: 0 },
      na: { normal: 0, extra: 0, float: 0 },
      ems_rn: { normal: 0, extra: 0, float: 0 },
      ems_tn: { normal: 0, extra: 0, float: 0 },
    },
    referrals: [
      { id: Date.now(), name: '', dx: '', destination: '' }
    ],
    notes: {
      pendingRefer: '',
      nursingNotes: '',
      specialEvents: ''
    }
  });

  // --- Derived Calculations ---
  const calculateTotals = () => {
    const s = formState.stats;
    const shift = formState.header.shift;
    
    // 1. คำนวณยอดคงเหลือรวม จากผลรวมจำแนกเตียง
    const r = s.resus; const o = s.obsAA; const c = s.c0;
    const totalResus = r.er + r.med + r.ped + r.gyne + r.ortho + r.sx + r.neuroSx;
    const totalObs = o.er + o.med + o.ped + o.gyne + o.ortho + o.sx + o.neuroSx;
    const totalC0 = c.er + c.med + c.ped + c.gyne + c.ortho + c.sx + c.neuroSx;
    
    // เงื่อนไข: ถ้าเป็นเวรบ่าย ให้นำยอดระดับ 4 มารวมด้วย
    const level4Val = shift === 'บ่าย' ? (s.level4 || 0) : 0;
    
    const totalRemaining = totalResus + totalObs + totalC0 + level4Val;
    
    // 2. คำนวณยอดจำหน่ายอัตโนมัติ = (ยอดยกมา + รับใหม่) - (refer ไป + ถึงแก่กรรม + หนี + admit + คงเหลือรวม)
    const calculatedDischarged = (s.carriedOver + s.newPatients) - (s.referOut + s.death + s.abscond + s.admit + totalRemaining);

    // 3. สรุปยอดตามกลุ่ม (Summary)
    const sumER = r.er + o.er + c.er;
    const sumMed = r.med + o.med + c.med;
    const sumNonMed = (r.ped + o.ped + c.ped) + (r.gyne + o.gyne + c.gyne) + (r.ortho + o.ortho + c.ortho) + (r.sx + o.sx + c.sx) + (r.neuroSx + o.neuroSx + c.neuroSx);

    return { totalRemaining, calculatedDischarged, totalResus, totalObs, totalC0, level4Val, sumER, sumMed, sumNonMed };
  };

  const totals = calculateTotals();

  // --- Handlers ---
  const handleNestedChange = (category, field, subfield, value) => {
    setFormState(prev => {
      if (subfield) {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: {
              ...prev[category][field],
              [subfield]: value
            }
          }
        };
      } else {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: value
          }
        };
      }
    });
  };

  const addReferral = () => {
    setFormState(prev => ({
      ...prev,
      referrals: [...prev.referrals, { id: Date.now(), name: '', dx: '', destination: '' }]
    }));
  };

  const removeReferral = (id) => {
    setFormState(prev => ({
      ...prev,
      referrals: prev.referrals.filter(ref => ref.id !== id)
    }));
  };

  const handleReferralChange = (id, field, value) => {
    setFormState(prev => ({
      ...prev,
      referrals: prev.referrals.map(ref => ref.id === id ? { ...ref, [field]: value } : ref)
    }));
  };

  const handleSaveDraft = () => {
    // In a real app, this would save to localStorage or backend
    alert('บันทึกร่างข้อมูลสำเร็จ (Draft saved successfully)');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ภาพรวมสถานการณ์ ER</h2>
          <p className="text-slate-500">ข้อมูลสถิติและการใช้งานเตียงประจำวัน</p>
        </div>
        <Button icon={FileDown} variant="secondary">ส่งออกรายงาน</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">ผู้ป่วยรับใหม่วันนี้</p>
              <h4 className="text-2xl font-bold text-slate-800">142</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Bed size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Admit รอเตียง</p>
              <h4 className="text-2xl font-bold text-slate-800">15</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">ผู้ป่วยระดับ 1 (Resus)</p>
              <h4 className="text-2xl font-bold text-slate-800">3</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">จำหน่ายแล้ว</p>
              <h4 className="text-2xl font-bold text-slate-800">98</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="ปริมาณผู้ป่วย ER รายชั่วโมง" />
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockShiftData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="สถิติ Admit/Discharge/Refer (สัปดาห์นี้)" />
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
                <Legend iconType="circle" />
                <Bar dataKey="admit" name="Admit" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discharge" name="Discharge" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="refer" name="Refer" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );


  const renderDataEntryForm = () => (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">ใบส่งยอดผู้ป่วย ห้องอุบัติเหตุและฉุกเฉิน</h2>
          <p className="text-sm text-slate-500">กรุณากรอกข้อมูลให้ครบถ้วนก่อนส่งมอบเวร</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Button variant="secondary" icon={Save} onClick={handleSaveDraft} className="whitespace-nowrap">บันทึกร่าง</Button>
          <Button variant="secondary" icon={Eye} onClick={() => setShowPreview(true)} className="whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 focus:ring-indigo-500">ดูตัวอย่าง</Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint} className="whitespace-nowrap">พิมพ์รายงาน</Button>
        </div>
      </div>

      {/* Header Info */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
          <Input 
            type="date" 
            label="วันที่รายงาน" 
            value={formState.header.date} 
            onChange={(e) => handleNestedChange('header', 'date', null, e.target.value)} 
          />
          <Select 
            label="เวรปฏิบัติงาน" 
            options={[
              { value: 'เช้า', label: 'เวรเช้า (08:00 - 16:00)' },
              { value: 'บ่าย', label: 'เวรบ่าย (16:00 - 24:00)' },
              { value: 'ดึก', label: 'เวรดึก (00:00 - 08:00)' }
            ]}
            value={formState.header.shift}
            onChange={(e) => handleNestedChange('header', 'shift', null, e.target.value)}
          />
          <Input 
            label="ผู้รายงาน" 
            placeholder="ชื่อ-สกุล พยาบาลผู้ส่งเวร"
            value={formState.header.reporter}
            onChange={(e) => handleNestedChange('header', 'reporter', null, e.target.value)}
          />
          <Input 
            label="หัวหน้าเวร/In-charge" 
            placeholder="ชื่อ-สกุล In-charge"
            value={formState.header.supervisor}
            onChange={(e) => handleNestedChange('header', 'supervisor', null, e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Main Statistics Matrix */}
      <Card className="border-blue-200 shadow-sm">
        <CardHeader 
          title="สถิติผู้ป่วย (Patient Statistics)" 
          className="bg-blue-50/50 border-blue-100"
        />
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border-b border-slate-100 bg-slate-50">
            {/* Top row primary inputs */}
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <NumberInput label="ยอดยกมา" value={formState.stats.carriedOver} onChange={(v) => handleNestedChange('stats', 'carriedOver', null, v)} className="bg-white" />
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <NumberInput label="รับใหม่" value={formState.stats.newPatients} onChange={(v) => handleNestedChange('stats', 'newPatients', null, v)} className="bg-white" />
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">จำหน่าย (Auto)</label>
                <div className={`px-3 py-2 border rounded-md text-sm shadow-sm flex items-center h-[38px] font-bold ${totals.calculatedDischarged < 0 ? 'bg-red-50 text-red-600 border-red-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                  {totals.calculatedDischarged}
                </div>
              </div>
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <NumberInput label="Refer ไป" value={formState.stats.referOut} onChange={(v) => handleNestedChange('stats', 'referOut', null, v)} className="bg-white" />
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <NumberInput label="ถึงแก่กรรม" value={formState.stats.death} onChange={(v) => handleNestedChange('stats', 'death', null, v)} className="bg-white" />
            </div>
            <div className="p-4 border-r border-slate-100 last:border-r-0">
              <NumberInput label="หนี" value={formState.stats.abscond} onChange={(v) => handleNestedChange('stats', 'abscond', null, v)} className="bg-white" />
            </div>
            <div className="p-4">
              <NumberInput label="Admit" value={formState.stats.admit} onChange={(v) => handleNestedChange('stats', 'admit', null, v)} className="bg-white" />
            </div>
          </div>

          {/* Totals Banner */}
          <div className="bg-blue-600 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Activity className="opacity-80" />
              <span className="text-lg font-medium">ยอดผู้ป่วยคงเหลือรวม (คำนวณอัตโนมัติ)</span>
            </div>
            <div className="text-3xl font-bold bg-blue-700 px-6 py-2 rounded-lg">
              {totals.totalRemaining}
            </div>
          </div>

          {/* Breakdown of remaining patients */}
          <div className="p-6 bg-slate-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">จำแนกยอดผู้ป่วยคงเหลือ</h4>
              <div className="flex gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm text-sm">
                <div className="px-3 py-1 border-r border-slate-200"><span className="text-slate-500 mr-2">รวม ER:</span><span className="font-bold text-blue-700">{totals.sumER}</span></div>
                <div className="px-3 py-1 border-r border-slate-200"><span className="text-slate-500 mr-2">รวม Med:</span><span className="font-bold text-blue-700">{totals.sumMed}</span></div>
                <div className="px-3 py-1"><span className="text-slate-500 mr-2">รวม Non-Med:</span><span className="font-bold text-blue-700">{totals.sumNonMed}</span></div>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${formState.header.shift === 'บ่าย' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              
              {/* Resus */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <h5 className="font-medium text-red-600">Resuscitation</h5>
                  <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{totals.totalResus}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">ER:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.er} onChange={(v) => handleNestedChange('stats', 'resus', 'er', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Med:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.med} onChange={(v) => handleNestedChange('stats', 'resus', 'med', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">PED:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.ped} onChange={(v) => handleNestedChange('stats', 'resus', 'ped', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Gyne:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.gyne} onChange={(v) => handleNestedChange('stats', 'resus', 'gyne', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Ortho:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.ortho} onChange={(v) => handleNestedChange('stats', 'resus', 'ortho', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Sx:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.sx} onChange={(v) => handleNestedChange('stats', 'resus', 'sx', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Neuro Sx:</span>
                    <NumberInput className="w-20" value={formState.stats.resus.neuroSx} onChange={(v) => handleNestedChange('stats', 'resus', 'neuroSx', v)} />
                  </div>
                </div>
              </div>

              {/* Observe AA */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <h5 className="font-medium text-orange-600">Observe AA</h5>
                  <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">{totals.totalObs}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">ER:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.er} onChange={(v) => handleNestedChange('stats', 'obsAA', 'er', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Med:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.med} onChange={(v) => handleNestedChange('stats', 'obsAA', 'med', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">PED:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.ped} onChange={(v) => handleNestedChange('stats', 'obsAA', 'ped', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Gyne:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.gyne} onChange={(v) => handleNestedChange('stats', 'obsAA', 'gyne', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Ortho:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.ortho} onChange={(v) => handleNestedChange('stats', 'obsAA', 'ortho', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Sx:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.sx} onChange={(v) => handleNestedChange('stats', 'obsAA', 'sx', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Neuro Sx:</span>
                    <NumberInput className="w-20" value={formState.stats.obsAA.neuroSx} onChange={(v) => handleNestedChange('stats', 'obsAA', 'neuroSx', v)} />
                  </div>
                </div>
              </div>

              {/* C0 (New day/Stable) */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <h5 className="font-medium text-green-600">รับใหม่ (C0)</h5>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{totals.totalC0}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">ER:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.er} onChange={(v) => handleNestedChange('stats', 'c0', 'er', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Med:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.med} onChange={(v) => handleNestedChange('stats', 'c0', 'med', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">PED:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.ped} onChange={(v) => handleNestedChange('stats', 'c0', 'ped', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Gyne:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.gyne} onChange={(v) => handleNestedChange('stats', 'c0', 'gyne', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Ortho:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.ortho} onChange={(v) => handleNestedChange('stats', 'c0', 'ortho', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Sx:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.sx} onChange={(v) => handleNestedChange('stats', 'c0', 'sx', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 w-20">Neuro Sx:</span>
                    <NumberInput className="w-20" value={formState.stats.c0.neuroSx} onChange={(v) => handleNestedChange('stats', 'c0', 'neuroSx', v)} />
                  </div>
                </div>
              </div>

              {/* Level 4 (แสดงเฉพาะเวรบ่าย) */}
              {formState.header.shift === 'บ่าย' && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <h5 className="font-medium text-purple-600">ระดับ 4</h5>
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{totals.level4Val}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-4 bg-purple-50/30 rounded-md border border-purple-100">
                    <label className="text-sm text-slate-500 mb-3">จำนวนผู้ป่วย (คน)</label>
                    <NumberInput 
                      className="w-24 text-center text-xl font-bold" 
                      value={formState.stats.level4} 
                      onChange={(v) => handleNestedChange('stats', 'level4', null, v)} 
                    />
                  </div>
                </div>
              )}

            </div>
            
            {/* Validation warning if discharged is negative */}
            {totals.calculatedDischarged < 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                <span>คำเตือน: ยอด "จำหน่าย" ติดลบ ({totals.calculatedDischarged}) กรุณาตรวจสอบ "ยอดยกมา", "รับใหม่" หรือยอดจำแนกเตียงด้านบน</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indicators / หมายเหตุ */}
      <Card>
        <CardHeader title="หมายเหตุ" />
        <CardContent className="space-y-6">
          {/* 1. กรณีพิเศษ */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">1. กรณีพิเศษ</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <NumberInput label="รอ Admit Med" value={formState.indicators.waitAdmitMed} onChange={(v) => handleNestedChange('indicators', 'waitAdmitMed', null, v)} />
              <NumberInput label="On ET-Tube" value={formState.indicators.etTube} onChange={(v) => handleNestedChange('indicators', 'etTube', null, v)} />
              <NumberInput label="On NIV" value={formState.indicators.niv} onChange={(v) => handleNestedChange('indicators', 'niv', null, v)} />
              <NumberInput label="On HFNC" value={formState.indicators.hfnc} onChange={(v) => handleNestedChange('indicators', 'hfnc', null, v)} />
              <NumberInput label="CPR" value={formState.indicators.cpr} onChange={(v) => handleNestedChange('indicators', 'cpr', null, v)} />
              <NumberInput label="COVID-19" value={formState.indicators.covid} onChange={(v) => handleNestedChange('indicators', 'covid', null, v)} />
            </div>
          </div>
          
          {/* 2. ยอดกำลังพล ทอ. */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">2. ยอดกำลังพล ทอ.</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput label="ในราชการ" value={formState.indicators.rtafInService} onChange={(v) => handleNestedChange('indicators', 'rtafInService', null, v)} />
              <NumberInput label="นอกราชการ" value={formState.indicators.rtafOutOfService} onChange={(v) => handleNestedChange('indicators', 'rtafOutOfService', null, v)} />
              <NumberInput label="พลทหาร ทอ." value={formState.indicators.rtafConscript} onChange={(v) => handleNestedChange('indicators', 'rtafConscript', null, v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staffing Section */}
      <Card>
        <CardHeader title="อัตรากำลังบุคลากร (Staffing)" />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">ตำแหน่ง</th>
                <th className="px-6 py-3 font-medium w-32 text-center">ปกติ (เวร)</th>
                <th className="px-6 py-3 font-medium w-32 text-center">โอที (เสริม)</th>
                <th className="px-6 py-3 font-medium w-32 text-center">Float/ช่วยเหลือ</th>
                <th className="px-6 py-3 font-medium text-center">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { key: 'rn', label: 'พยาบาลวิชาชีพ (RN)' },
                { key: 'tn', label: 'พยาบาลเทคนิค (TN)' },
                { key: 'na', label: 'ผู้ช่วยพยาบาล (NA)' },
                { key: 'ems_rn', label: 'เจ้าหน้าที่กู้ชีพ (RN)' },
                { key: 'ems_tn', label: 'เจ้าหน้าที่กู้ชีพ (TN)' }
              ].map(role => (
                <tr key={role.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{role.label}</td>
                  <td className="px-6 py-2"><NumberInput value={formState.staffing[role.key].normal} onChange={(v) => handleNestedChange('staffing', role.key, 'normal', v)} className="w-full" /></td>
                  <td className="px-6 py-2"><NumberInput value={formState.staffing[role.key].extra} onChange={(v) => handleNestedChange('staffing', role.key, 'extra', v)} className="w-full" /></td>
                  <td className="px-6 py-2"><NumberInput value={formState.staffing[role.key].float} onChange={(v) => handleNestedChange('staffing', role.key, 'float', v)} className="w-full" /></td>
                  <td className="px-6 py-3 text-center font-bold text-slate-700 bg-slate-50/50">
                    {formState.staffing[role.key].normal + formState.staffing[role.key].extra + formState.staffing[role.key].float}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Refer Out List */}
      <Card>
        <CardHeader 
          title="รายชื่อผู้ป่วยส่งต่อ (Refer Out)" 
          action={<Button size="sm" icon={Plus} onClick={addReferral}>เพิ่มผู้ป่วย</Button>}
        />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium w-12 text-center">ลำดับ</th>
                <th className="px-6 py-3 font-medium">ชื่อ-สกุล ผู้ป่วย</th>
                <th className="px-6 py-3 font-medium">Diagnosis (Dx)</th>
                <th className="px-6 py-3 font-medium">รพ. ปลายทาง</th>
                <th className="px-6 py-3 font-medium w-16 text-center">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formState.referrals.map((ref, index) => (
                <tr key={ref.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-2 text-center text-slate-500">{index + 1}</td>
                  <td className="px-6 py-2"><Input value={ref.name} onChange={(e) => handleReferralChange(ref.id, 'name', e.target.value)} placeholder="ชื่อ นามสกุล" /></td>
                  <td className="px-6 py-2"><Input value={ref.dx} onChange={(e) => handleReferralChange(ref.id, 'dx', e.target.value)} placeholder="การวินิจฉัย" /></td>
                  <td className="px-6 py-2"><Input value={ref.destination} onChange={(e) => handleReferralChange(ref.id, 'destination', e.target.value)} placeholder="ชื่อโรงพยาบาล" /></td>
                  <td className="px-6 py-2 text-center">
                    <button 
                      onClick={() => removeReferral(ref.id)}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {formState.referrals.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    ไม่มีข้อมูลผู้ป่วย Refer ในเวรนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Notes and Special Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader title="การพยาบาลต่อเนื่อง / ส่งเวร" />
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5">ผู้ป่วยค้าง Refer / เหตุผล</label>
              <textarea 
                className="flex-1 min-h-[100px] p-3 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="ระบุชื่อผู้ป่วยที่รอ Refer และสาเหตุที่ล่าช้า (ถ้ามี)..."
                value={formState.notes.pendingRefer}
                onChange={(e) => handleNestedChange('notes', 'pendingRefer', null, e.target.value)}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5">บันทึกทางการพยาบาลเพิ่มเติม (Nursing Notes)</label>
              <textarea 
                className="flex-1 min-h-[120px] p-3 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="ข้อมูลสำคัญที่ต้องการส่งต่อเวรถัดไป..."
                value={formState.notes.nursingNotes}
                onChange={(e) => handleNestedChange('notes', 'nursingNotes', null, e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-orange-200">
          <CardHeader title="เหตุการณ์พิเศษ (Special Events)" className="bg-orange-50/50" />
          <CardContent className="flex-1 flex flex-col">
             <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500" />
              อุบัติการณ์ความเสี่ยง, บุคลากรบาดเจ็บ, Case VIP
            </label>
            <textarea 
              className="flex-1 min-h-[250px] p-3 border border-orange-200 rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-orange-50/30 resize-none"
              placeholder="บันทึกเหตุการณ์ที่ไม่ปกติที่เกิดขึ้นในเวร..."
              value={formState.notes.specialEvents}
              onChange={(e) => handleNestedChange('notes', 'specialEvents', null, e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  );

  const renderPrintPreview = () => (
    <div className="min-h-screen bg-slate-200 print:bg-white flex flex-col font-sans text-slate-900">
      {/* Top Action Bar for Preview */}
      <div className="sticky top-0 z-50 bg-slate-800 text-white px-6 py-4 flex justify-between items-center print:hidden shadow-lg">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Eye size={20}/> ตัวอย่างก่อนพิมพ์ (Print Preview)</h2>
          <p className="text-sm text-slate-300 mt-1">กรุณาตรวจสอบความถูกต้อง รูปแบบนี้จะถูกใช้เมื่อสั่งพิมพ์ลงกระดาษ A4</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowPreview(false)} className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
            <X size={18} /> ปิดหน้าต่าง
          </Button>
          <Button variant="primary" onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600 border-none shadow-md">
            <Printer size={18} /> สั่งพิมพ์เอกสาร
          </Button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="flex-1 py-8 print:py-0 overflow-y-auto">
        <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none p-[15mm] text-slate-900 text-sm">
           {/* Document Content */}
           <div className="text-center mb-6">
             <h1 className="text-xl font-bold mb-2">ใบรายงานส่งยอดผู้ป่วย แผนกอุบัติเหตุและฉุกเฉิน</h1>
             <p className="text-base">
                <strong>ประจำวันที่:</strong> {new Date(formState.header.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} 
                <span className="mx-4">|</span> 
                <strong>เวร:</strong> {formState.header.shift}
             </p>
           </div>
           
           <div className="flex justify-between mb-4 font-medium text-base">
             <p>ผู้ส่งเวร: {formState.header.reporter || '.............................................'}</p>
             <p>หัวหน้าเวร (In-charge): {formState.header.supervisor || '.............................................'}</p>
           </div>

           {/* 1. สถิติผู้ป่วย */}
           <h3 className="font-bold mb-2 text-base border-b border-black pb-1">1. สถิติผู้ป่วย (Patient Statistics)</h3>
           <table className="w-full border-collapse border border-black mb-6 text-center">
             <thead>
               <tr className="bg-slate-100">
                 <th className="border border-black py-1.5">ยอดยกมา</th>
                 <th className="border border-black py-1.5">รับใหม่</th>
                 <th className="border border-black py-1.5">จำหน่าย</th>
                 <th className="border border-black py-1.5">Refer ไป</th>
                 <th className="border border-black py-1.5">ถึงแก่กรรม</th>
                 <th className="border border-black py-1.5">หนี</th>
                 <th className="border border-black py-1.5">Admit</th>
                 <th className="border border-black py-1.5 bg-slate-200">คงเหลือรวม</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className="border border-black py-2.5 text-lg">{formState.stats.carriedOver}</td>
                 <td className="border border-black py-2.5 text-lg">{formState.stats.newPatients}</td>
                 <td className="border border-black py-2.5 text-lg font-bold">{totals.calculatedDischarged}</td>
                 <td className="border border-black py-2.5 text-lg">{formState.stats.referOut}</td>
                 <td className="border border-black py-2.5 text-lg">{formState.stats.death}</td>
                 <td className="border border-black py-2.5 text-lg">{formState.stats.abscond}</td>
                 <td className="border border-black py-2.5 text-lg">{formState.stats.admit}</td>
                 <td className="border border-black py-2.5 text-lg font-bold bg-slate-100">{totals.totalRemaining}</td>
               </tr>
             </tbody>
           </table>

           {/* 2. จำแนกยอดผู้ป่วยคงเหลือ */}
           <div className="flex justify-between items-end mb-2 border-b border-black pb-1">
             <h3 className="font-bold text-base m-0">2. จำแนกยอดผู้ป่วยคงเหลือ</h3>
             <div className="text-sm">
               ( <strong>ER:</strong> {totals.sumER} <span className="mx-1">|</span> <strong>Med:</strong> {totals.sumMed} <span className="mx-1">|</span> <strong>Non-Med:</strong> {totals.sumNonMed} )
             </div>
           </div>

           {totals.totalRemaining === 0 ? (
             <div className="border border-black py-4 mb-6 text-center text-slate-600 text-sm bg-slate-50">
               ไม่มีข้อมูลผู้ป่วยคงเหลือ
             </div>
           ) : (
             <div className={`grid gap-4 mb-6 items-start ${formState.header.shift === 'บ่าย' && totals.level4Val > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
               
               {/* Resus Table */}
               {totals.totalResus > 0 && (
                 <table className="w-full border-collapse border border-black text-center text-sm">
                   <thead><tr><th colSpan="2" className="border border-black py-1 bg-slate-100">Resuscitation ({totals.totalResus})</th></tr></thead>
                   <tbody>
                     {formState.stats.resus.er > 0 && <tr><td className="border border-black py-1 px-2 text-left w-2/3">ER</td><td className="border border-black py-1 font-medium">{formState.stats.resus.er}</td></tr>}
                     {formState.stats.resus.med > 0 && <tr><td className="border border-black py-1 px-2 text-left">Med</td><td className="border border-black py-1 font-medium">{formState.stats.resus.med}</td></tr>}
                     {formState.stats.resus.ped > 0 && <tr><td className="border border-black py-1 px-2 text-left">PED</td><td className="border border-black py-1 font-medium">{formState.stats.resus.ped}</td></tr>}
                     {formState.stats.resus.gyne > 0 && <tr><td className="border border-black py-1 px-2 text-left">Gyne</td><td className="border border-black py-1 font-medium">{formState.stats.resus.gyne}</td></tr>}
                     {formState.stats.resus.ortho > 0 && <tr><td className="border border-black py-1 px-2 text-left">Ortho</td><td className="border border-black py-1 font-medium">{formState.stats.resus.ortho}</td></tr>}
                     {formState.stats.resus.sx > 0 && <tr><td className="border border-black py-1 px-2 text-left">Sx</td><td className="border border-black py-1 font-medium">{formState.stats.resus.sx}</td></tr>}
                     {formState.stats.resus.neuroSx > 0 && <tr><td className="border border-black py-1 px-2 text-left">Neuro Sx</td><td className="border border-black py-1 font-medium">{formState.stats.resus.neuroSx}</td></tr>}
                   </tbody>
                 </table>
               )}

               {/* ObsAA Table */}
               {totals.totalObs > 0 && (
                 <table className="w-full border-collapse border border-black text-center text-sm">
                   <thead><tr><th colSpan="2" className="border border-black py-1 bg-slate-100">Observe AA ({totals.totalObs})</th></tr></thead>
                   <tbody>
                     {formState.stats.obsAA.er > 0 && <tr><td className="border border-black py-1 px-2 text-left w-2/3">ER</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.er}</td></tr>}
                     {formState.stats.obsAA.med > 0 && <tr><td className="border border-black py-1 px-2 text-left">Med</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.med}</td></tr>}
                     {formState.stats.obsAA.ped > 0 && <tr><td className="border border-black py-1 px-2 text-left">PED</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.ped}</td></tr>}
                     {formState.stats.obsAA.gyne > 0 && <tr><td className="border border-black py-1 px-2 text-left">Gyne</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.gyne}</td></tr>}
                     {formState.stats.obsAA.ortho > 0 && <tr><td className="border border-black py-1 px-2 text-left">Ortho</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.ortho}</td></tr>}
                     {formState.stats.obsAA.sx > 0 && <tr><td className="border border-black py-1 px-2 text-left">Sx</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.sx}</td></tr>}
                     {formState.stats.obsAA.neuroSx > 0 && <tr><td className="border border-black py-1 px-2 text-left">Neuro Sx</td><td className="border border-black py-1 font-medium">{formState.stats.obsAA.neuroSx}</td></tr>}
                   </tbody>
                 </table>
               )}

               {/* C0 Table */}
               {totals.totalC0 > 0 && (
                 <table className="w-full border-collapse border border-black text-center text-sm">
                   <thead><tr><th colSpan="2" className="border border-black py-1 bg-slate-100">รับใหม่ C0 ({totals.totalC0})</th></tr></thead>
                   <tbody>
                     {formState.stats.c0.er > 0 && <tr><td className="border border-black py-1 px-2 text-left w-2/3">ER</td><td className="border border-black py-1 font-medium">{formState.stats.c0.er}</td></tr>}
                     {formState.stats.c0.med > 0 && <tr><td className="border border-black py-1 px-2 text-left">Med</td><td className="border border-black py-1 font-medium">{formState.stats.c0.med}</td></tr>}
                     {formState.stats.c0.ped > 0 && <tr><td className="border border-black py-1 px-2 text-left">PED</td><td className="border border-black py-1 font-medium">{formState.stats.c0.ped}</td></tr>}
                     {formState.stats.c0.gyne > 0 && <tr><td className="border border-black py-1 px-2 text-left">Gyne</td><td className="border border-black py-1 font-medium">{formState.stats.c0.gyne}</td></tr>}
                     {formState.stats.c0.ortho > 0 && <tr><td className="border border-black py-1 px-2 text-left">Ortho</td><td className="border border-black py-1 font-medium">{formState.stats.c0.ortho}</td></tr>}
                     {formState.stats.c0.sx > 0 && <tr><td className="border border-black py-1 px-2 text-left">Sx</td><td className="border border-black py-1 font-medium">{formState.stats.c0.sx}</td></tr>}
                     {formState.stats.c0.neuroSx > 0 && <tr><td className="border border-black py-1 px-2 text-left">Neuro Sx</td><td className="border border-black py-1 font-medium">{formState.stats.c0.neuroSx}</td></tr>}
                   </tbody>
                 </table>
               )}

               {/* Level 4 Table (แสดงเฉพาะเวรบ่ายและมียอด > 0) */}
               {formState.header.shift === 'บ่าย' && totals.level4Val > 0 && (
                 <table className="w-full border-collapse border border-black text-center text-sm">
                   <thead><tr><th className="border border-black py-1 bg-slate-100">ระดับ 4</th></tr></thead>
                   <tbody>
                     <tr><td className="border border-black py-2 text-xl font-bold">{totals.level4Val}</td></tr>
                   </tbody>
                 </table>
               )}

             </div>
           )}

           {/* 3. หมายเหตุ */}
           <h3 className="font-bold mb-2 text-base border-b border-black pb-1">3. หมายเหตุ</h3>
           <div className="mb-6 text-sm">
             <div className="font-bold mb-2 mt-2">3.1 กรณีพิเศษ</div>
             <div className="grid grid-cols-3 gap-2 mb-4">
               <div className="border border-black py-1 px-2 flex justify-between"><span>รอ Admit Med:</span> <strong>{formState.indicators.waitAdmitMed}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>On ET-Tube:</span> <strong>{formState.indicators.etTube}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>On NIV:</span> <strong>{formState.indicators.niv}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>On HFNC:</span> <strong>{formState.indicators.hfnc}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>CPR:</span> <strong>{formState.indicators.cpr}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>COVID-19:</span> <strong>{formState.indicators.covid}</strong></div>
             </div>
             
             <div className="font-bold mb-2">3.2 ยอดกำลังพล ทอ.</div>
             <div className="grid grid-cols-3 gap-2">
               <div className="border border-black py-1 px-2 flex justify-between"><span>ในราชการ:</span> <strong>{formState.indicators.rtafInService}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>นอกราชการ:</span> <strong>{formState.indicators.rtafOutOfService}</strong></div>
               <div className="border border-black py-1 px-2 flex justify-between"><span>พลทหาร ทอ.:</span> <strong>{formState.indicators.rtafConscript}</strong></div>
             </div>
           </div>

           {/* 4 & 5 Section Grid */}
           <div className="grid grid-cols-2 gap-6 mb-6">
             {/* 4. Staffing */}
             <div>
                <h3 className="font-bold mb-2 text-base border-b border-black pb-1">4. อัตรากำลัง (Staffing)</h3>
                <table className="w-full border-collapse border border-black text-center text-sm">
                   <thead>
                     <tr className="bg-slate-100">
                       <th className="border border-black py-1 text-left px-2">ตำแหน่ง</th>
                       <th className="border border-black py-1">ปกติ</th>
                       <th className="border border-black py-1">เสริม</th>
                       <th className="border border-black py-1">Float</th>
                       <th className="border border-black py-1">รวม</th>
                     </tr>
                   </thead>
                   <tbody>
                     {[
                        { key: 'rn', label: 'วิชาชีพ (RN)' },
                        { key: 'tn', label: 'เทคนิค (TN)' },
                        { key: 'na', label: 'ผู้ช่วย (NA)' },
                        { key: 'ems_rn', label: 'กู้ชีพ (RN)' },
                        { key: 'ems_tn', label: 'กู้ชีพ (TN)' }
                     ].map(role => (
                       <tr key={role.key}>
                         <td className="border border-black py-1 px-2 text-left">{role.label}</td>
                         <td className="border border-black py-1">{formState.staffing[role.key].normal}</td>
                         <td className="border border-black py-1">{formState.staffing[role.key].extra}</td>
                         <td className="border border-black py-1">{formState.staffing[role.key].float}</td>
                         <td className="border border-black py-1 font-bold">
                           {formState.staffing[role.key].normal + formState.staffing[role.key].extra + formState.staffing[role.key].float}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
             </div>

             {/* 5. Refer Out */}
             <div>
                <h3 className="font-bold mb-2 text-base border-b border-black pb-1">5. ผู้ป่วยส่งต่อ (Refer Out)</h3>
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black py-1 w-10 text-center">ลำดับ</th>
                      <th className="border border-black py-1 px-2 text-left">ชื่อ-สกุล</th>
                      <th className="border border-black py-1 px-2 text-left">Diagnosis / รพ.ปลายทาง</th>
                    </tr>
                  </thead>
                  <tbody>
                     {formState.referrals.length > 0 ? formState.referrals.map((r,i) => (
                       <tr key={r.id}>
                         <td className="border border-black py-1 text-center">{i+1}</td>
                         <td className="border border-black py-1 px-2">{r.name || '-'}</td>
                         <td className="border border-black py-1 px-2">{r.dx ? `${r.dx} -> ` : ''}{r.destination || '-'}</td>
                       </tr>
                     )) : (
                       <tr><td colSpan="3" className="border border-black py-2 text-center text-slate-500">ไม่มีข้อมูล</td></tr>
                     )}
                  </tbody>
                </table>
             </div>
           </div>

           {/* 6. Notes */}
           <h3 className="font-bold mb-2 text-base border-b border-black pb-1">6. บันทึกทางการพยาบาล / เหตุการณ์พิเศษ</h3>
           <div className="border border-black p-3 mb-2 text-sm min-h-[60px] whitespace-pre-wrap">
             <strong>ผู้ป่วยค้าง Refer / เหตุผล:</strong><br/>
             {formState.notes.pendingRefer || '-'}
           </div>
           <div className="border border-black p-3 mb-2 text-sm min-h-[80px] whitespace-pre-wrap">
             <strong>บันทึกทางการพยาบาลเพิ่มเติม (Nursing Notes):</strong><br/>
             {formState.notes.nursingNotes || '-'}
           </div>
           <div className="border border-black p-3 mb-8 text-sm min-h-[80px] whitespace-pre-wrap">
             <strong>เหตุการณ์พิเศษ (Special Events) / บุคลากรบาดเจ็บ / Case VIP:</strong><br/>
             {formState.notes.specialEvents || '-'}
           </div>

           {/* Signatures */}
           <div className="grid grid-cols-2 gap-8 mt-12 text-center text-base">
             <div>
                <p>ลงชื่อ.........................................................ผู้ส่งเวร</p>
                <p className="mt-3">( {formState.header.reporter ? `  ${formState.header.reporter}  ` : '.........................................................'} )</p>
             </div>
             <div>
                <p>ลงชื่อ.........................................................หัวหน้าเวร</p>
                <p className="mt-3">( {formState.header.supervisor ? `  ${formState.header.supervisor}  ` : '.........................................................'} )</p>
             </div>
           </div>

        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 print:bg-white ${showPreview ? 'hidden' : 'flex'}`}>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-700 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md print:hidden">
        <div className="flex items-center gap-2">
          <Activity size={24} className="text-blue-200" />
          <h1 className="font-bold text-lg tracking-tight">ER Shift Report</h1>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-blue-600 rounded-md">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:sticky top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out
        bg-slate-900 text-slate-300 flex flex-col shadow-xl md:shadow-none print:hidden
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 text-white border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
            <Activity size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-tight">ER Shift</h1>
            <p className="text-xs text-blue-400 font-medium tracking-wider uppercase">Census Report</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
          
          <button 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LineChart size={18} />
            <span>แดชบอร์ด (Dashboard)</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('form'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              activeTab === 'form' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText size={18} />
            <span>กรอกข้อมูลส่งเวร (Data Entry)</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
              RN
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">พยาบาลวิชาชีพ</p>
              <p className="text-xs text-slate-500 truncate">แผนกฉุกเฉิน</p>
            </div>
          </div>
          <button className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible">
        
        {/* Desktop Top Bar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 justify-between items-center z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-4 text-slate-600 text-sm">
            <div className="flex items-center gap-1.5"><Calendar size={16} /> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <div className="flex items-center gap-1.5"><Clock size={16} /> {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
          </div>
          <div className="flex items-center gap-3">
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> System Online
            </span>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:overflow-visible print:p-0">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'form' && renderDataEntryForm()}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      </div>

      {/* Print Preview Overlay */}
      {showPreview && renderPrintPreview()}
    </>
  );
}