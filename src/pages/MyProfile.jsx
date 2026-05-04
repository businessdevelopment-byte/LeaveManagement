import React, { useState, useEffect } from 'react';
import { Save, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function MyProfile() {
  const { user } = useAuthStore();
  
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
        name: user.name || 'JOHN DOE',
        contactNo: user.contactNo || '9876543210',
        gmail: user.gmail || 'john.doe@example.com',
        employeeCode: user.employeeCode || 'E1002',
        designation: user.designation || 'SOFTWARE ENGINEER',
        userId: user.username || 'john.doe',
        pass: 'pass123',
        role: user.role || 'User'
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 gap-4 overflow-y-auto">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
          <UserIcon size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Manage your personal information</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile No</label>
              <input 
                required 
                type="text" 
                value={formData.contactNo} 
                onChange={(e) => setFormData({...formData, contactNo: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gmail</label>
              <input 
                required 
                type="email" 
                value={formData.gmail} 
                onChange={(e) => setFormData({...formData, gmail: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Code</label>
              <input 
                required 
                type="text" 
                value={formData.employeeCode} 
                onChange={(e) => setFormData({...formData, employeeCode: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
              <input 
                required 
                type="text" 
                value={formData.designation} 
                onChange={(e) => setFormData({...formData, designation: e.target.value.toUpperCase()})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login ID</label>
              <input 
                required 
                type="text" 
                value={formData.userId} 
                onChange={(e) => setFormData({...formData, userId: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
              <input 
                required 
                type="text" 
                value={formData.pass} 
                onChange={(e) => setFormData({...formData, pass: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
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

          <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end">
            <button 
              type="submit" 
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 sm:py-2.5 px-8 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm shadow-sky-100 uppercase text-xs tracking-widest"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
