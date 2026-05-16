import React, { useState, useEffect } from 'react';
import { User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function MyProfile() {
  const { user } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    gmail: '',
    employeeCode: '',
    designation: '',
    userId: '',
    pass: '',
    role: 'User'
  });

  useEffect(() => {
    // Populate form with current user context
    if (user) {
      setFormData({
        name: user.name || '',
        contactNo: user.mobile || '',
        gmail: user.gmail || '',
        employeeCode: user.employeeCode || '',
        designation: user.designation || '',
        userId: user.username || '',
        pass: user.pass || '',
        role: user.role || 'USER'
      });
    }
  }, [user]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 gap-4 overflow-y-auto">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
          <UserIcon size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Your personal information</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
            <input 
              readOnly 
              type="text" 
              value={formData.name} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 cursor-default" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile No</label>
              <input 
                readOnly 
                type="text" 
                value={formData.contactNo} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 cursor-default" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gmail</label>
              <input 
                readOnly 
                type="email" 
                value={formData.gmail} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 cursor-default" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Code</label>
              <input 
                readOnly 
                type="text" 
                value={formData.employeeCode} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 cursor-default" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
              <input 
                readOnly 
                type="text" 
                value={formData.designation} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 cursor-default" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login ID</label>
              <input 
                readOnly 
                type="text" 
                value={formData.userId} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 cursor-default" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input 
                  readOnly 
                  type={showPass ? "text" : "password"} 
                  value={formData.pass} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-bold text-slate-700 cursor-default" 
                />
                <button 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role (Read Only)</label>
            <input 
              readOnly 
              type="text" 
              value={formData.role} 
              className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg px-4 py-2 text-sm font-bold cursor-not-allowed uppercase tracking-wider" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
