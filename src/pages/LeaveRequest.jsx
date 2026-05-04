import React, { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  Eye,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  FileText,
  User,
  Briefcase,
  Phone,
  ArrowRight,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const REQUEST_TYPES = ['Leave Request', 'WFH Request', 'Punchmiss Request', 'Weekoff Request'];

const formatUIDate = (dateStr) => {
  if (!dateStr || dateStr === '-' || String(dateStr).trim() === '') return '-';
  const s = String(dateStr).trim();
  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // YYYY/MM/DD or YYYY/MM/DD HH:MM:SS (Google Sheets format)
  const slashMatch = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashMatch) return `${slashMatch[3]}/${slashMatch[2]}/${slashMatch[1]}`;
  // YYYY-MM-DD or ISO
  const dashMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) return `${dashMatch[3]}/${dashMatch[2]}/${dashMatch[1]}`;
  return s;
};

export default function LeaveRequest() {
  const { user: currentUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [allRequests, setAllRequests] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [masterData, setMasterData] = useState({ employees: [], managers: [] });

  const isAdmInit = currentUser?.role === 'ADMIN';
  const [formData, setFormData] = useState({
    type: 'Leave Request',
    userName: isAdmInit ? '' : (currentUser?.name || ''),
    employeeId: isAdmInit ? '' : (currentUser?.employeeCode || ''),
    designation: isAdmInit ? '' : (currentUser?.designation || ''),
    mobile: isAdmInit ? '' : (currentUser?.mobile || ''),
    fromDate: '',
    toDate: '',
    date: '',
    days: '',
    remarks: '',
    manager: '',
    managerId: '',
    proof: null,
    proofPreview: ''
  });

  const [filters, setFilters] = useState({
    searchQuery: '',
    fromDate: '',
    toDate: '',
    type: '',
    manager: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchRequests = async () => {
    try {
      setIsInitialLoading(true);
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      const res = await fetch(`${scriptUrl}?sheet=${import.meta.env.VITE_DATA_SHEET || 'Data'}`);
      const json = await res.json();

      if (json.success) {
        const rows = json.data.slice(1);
        const reqs = rows.filter(r => r[1] && String(r[1]).startsWith('SN-')).map(r => ({
          id: String(r[0]) + String(r[1]),
          timestamp: String(r[0]),
          sn: String(r[1]),
          type: String(r[2]),
          employeeId: String(r[3]),
          name: String(r[4]),
          designation: String(r[5]),
          mobile: String(r[6]),
          from: String(r[7]),
          to: String(r[8]),
          days: String(r[9]),
          manager: String(r[10]),
          managerId: String(r[11]),
          remarks: String(r[12]),
          proofUrl: String(r[13] || ''),
          status: String(r[17] || 'Pending')
        }));
        setAllRequests(reqs.reverse());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchMasterData = async () => {
    // If already loaded, skip
    if (masterData.employees.length > 0) return;

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      const res = await fetch(`${scriptUrl}?sheet=${import.meta.env.VITE_MASTER_SHEET || 'Master'}`);
      const json = await res.json();

      if (json.success) {
        const rows = json.data.slice(1);
        const emps = [];
        const mgrs = [];
        rows.forEach(r => {
          if (r[0] && r[1]) emps.push({ id: String(r[0]), name: String(r[1]), designation: String(r[2]), mobile: String(r[3]) });
          if (r[5] && r[6]) mgrs.push({ name: String(r[5]), id: String(r[6]) });
        });
        setMasterData({ employees: emps, managers: mgrs });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleNameChange = (e) => {
    const selectedName = e.target.value;
    const emp = masterData.employees.find(x => x.name === selectedName);
    setFormData(prev => ({
      ...prev,
      userName: selectedName,
      employeeId: emp ? emp.id : '',
      designation: emp ? emp.designation : '',
      mobile: emp ? emp.mobile : ''
    }));
  };

  const handleManagerChange = (e) => {
    const selectedName = e.target.value;
    const mgr = masterData.managers.find(x => x.name === selectedName);
    setFormData(prev => ({
      ...prev,
      manager: selectedName,
      managerId: mgr ? mgr.id : ''
    }));
  };
  useEffect(() => {
    if (formData.fromDate && formData.toDate && (formData.type === 'Leave Request' || formData.type === 'WFH Request')) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days: diffDays.toString() }));
      } else {
        setFormData(prev => ({ ...prev, days: '0' }));
      }
    }
  }, [formData.fromDate, formData.toDate, formData.type]);

  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      // Data Isolation: Non-admins can only see their own requests
      if (currentUser?.role !== 'ADMIN' && req.employeeId !== currentUser?.employeeCode) {
        return false;
      }

      const q = filters.searchQuery.toLowerCase();
      const matchesSearch = !filters.searchQuery ||
        req.sn.toLowerCase().includes(q) ||
        req.name.toLowerCase().includes(q) ||
        req.type.toLowerCase().includes(q);
      const matchesType = !filters.type || req.type === filters.type;
      const matchesManager = !filters.manager || req.manager === filters.manager;
      return matchesSearch && matchesType && matchesManager;
    });
  }, [allRequests, filters, currentUser]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, proof: file, proofPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetFormAndClose = () => {
    setShowFormModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const isAdm = currentUser?.role === 'ADMIN';

    setFormData({
      type: 'Leave Request',
      userName: isAdm ? '' : (currentUser?.name || ''),
      employeeId: isAdm ? '' : (currentUser?.employeeCode || ''),
      designation: isAdm ? '' : (currentUser?.designation || ''),
      mobile: isAdm ? '' : (currentUser?.mobile || ''),
      fromDate: '',
      toDate: '',
      date: '',
      days: '',
      remarks: '',
      manager: '',
      managerId: '',
      proof: null,
      proofPreview: ''
    });
  };

  const compressImage = (base64, maxWidth) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality
      };
    });
  };

  const handleOpenForm = () => {
    fetchMasterData();
    setShowFormModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const ts = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const nextSnNum = allRequests.length > 0 ? parseInt(allRequests[0].sn.split('-')[1]) + 1 : 1;
      const newSn = `SN-${String(nextSnNum).padStart(3, '0')}`;

      const finalFrom = (formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') ? formData.date : formData.fromDate;
      const finalTo = (formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') ? '-' : formData.toDate;
      const finalDays = (formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') ? '-' : formData.days;

      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;

      let fileUrl = '';
      if (formData.type === 'Punchmiss Request' && formData.proofPreview && formData.proof) {
        const toastId = toast.loading('Compressing and uploading proof...');
        try {
          const compressedBase64 = await compressImage(formData.proofPreview, 800);
          const uploadRes = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'uploadFile',
              base64Data: compressedBase64,
              fileName: `${newSn}_${formData.proof.name}`,
              mimeType: 'image/jpeg',
              folderId: '1kCXEgCQ5KVU3cdODc8-NjUPm2ateczvW'
            })
          });
          const uploadJson = await uploadRes.json();
          if (!uploadJson.success) throw new Error(uploadJson.error || 'File upload failed');
          fileUrl = uploadJson.fileUrl;
          toast.success('Proof uploaded!', { id: toastId });
        } catch (uploadErr) {
          toast.error('Upload failed, but submitting request...', { id: toastId });
          console.error(uploadErr);
        }
      }

      const newRequestRow = [
        ts, // A
        newSn, // B
        formData.type, // C
        formData.employeeId, // D
        formData.userName, // E
        formData.designation, // F
        formData.mobile, // G
        finalFrom, // H
        finalTo, // I
        finalDays, // J
        formData.manager, // K
        formData.managerId, // L
        formData.remarks, // M
        fileUrl // N
      ];

      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'insert',
          sheetName: import.meta.env.VITE_DATA_SHEET || 'Data',
          rowData: JSON.stringify(newRequestRow)
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const newRequest = {
        id: ts + newSn,
        timestamp: ts,
        sn: newSn,
        type: formData.type,
        employeeId: formData.employeeId,
        name: formData.userName,
        designation: formData.designation,
        mobile: formData.mobile,
        from: finalFrom,
        to: finalTo,
        days: finalDays,
        manager: formData.manager,
        managerId: formData.managerId,
        remarks: formData.remarks,
        proofUrl: fileUrl,
        status: 'Pending'
      };

      setAllRequests(prev => [newRequest, ...prev]);
      resetFormAndClose();
      toast.success('Request saved and stored in sheet successfully!', { duration: 4000 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 gap-4 overflow-y-auto overflow-x-hidden relative scrollbar-hide">

      {/* Search and Filters Bar - Match Screenshot Header */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center gap-3 shadow-sm">

        <div className="flex w-full lg:w-auto gap-2 items-center flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Name, Serial No..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-sky-500 text-sm h-[38px]"
            />
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center justify-center rounded-md shadow-sm h-[38px] w-[38px] flex-shrink-0 transition ${showMobileFilters ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter size={16} />
          </button>

          <button
            onClick={handleOpenForm}
            className="lg:hidden bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center rounded-md h-[38px] w-[38px] shadow-sm flex-shrink-0 transition-colors"
          >
            <span className="text-xl font-bold leading-none mt-[-2px]">+</span>
          </button>
        </div>

        <div className={`${showMobileFilters ? 'grid' : 'hidden'} lg:flex grid-cols-2 lg:flex-row gap-2 w-full lg:w-auto items-center`}>
          <input
            type="text"
            placeholder="From Date"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
            className="w-full lg:w-36 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-500 h-[38px]"
          />
          <input
            type="text"
            placeholder="To Date"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
            className="w-full lg:w-36 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-500 h-[38px]"
          />
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full lg:w-40 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-500 h-[38px]"
          >
            <option value="">All Types</option>
            {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filters.manager}
            onChange={(e) => setFilters({ ...filters, manager: e.target.value })}
            className="w-full lg:w-40 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-500 h-[38px]"
          >
            <option value="">All Managers</option>
          </select>
        </div>

        <button
          onClick={handleOpenForm}
          className="hidden lg:flex bg-[#0284c7] hover:bg-[#0369a1] text-white px-6 py-2 h-[38px] rounded-md font-bold text-sm items-center justify-center gap-2 whitespace-nowrap shadow-sm uppercase tracking-wider transition-colors flex-shrink-0"
        >
          <span className="text-lg font-black leading-none mt-[1px]">+</span> Create Request
        </button>
      </div>

      {/* Data Section */}
      <div className="bg-white rounded-lg border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-sm">

        {isInitialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[400px]">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Loading......</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="md:hidden flex flex-col gap-2 p-2 overflow-y-auto flex-1 bg-slate-50/50">
          {paginatedRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col gap-2 relative">
              <div className="flex justify-between items-center bg-slate-50 -mx-3 -mt-3 px-3 py-2 border-b border-slate-100 rounded-t-lg">
                <span className="text-[11px] font-bold text-sky-600">{req.sn}</span>
                <div className="flex gap-1">
                <span className={`px-2 py-0.5 rounded text-[9px] tracking-widest uppercase border ${req.type === 'Leave Request' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                  req.type === 'WFH Request' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    req.type === 'Punchmiss Request' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                  {req.type.split(' ')[0]}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] tracking-widest uppercase border ${
                  req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                  'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {req.status}
                </span>
                </div>
              </div>

              <div className="flex justify-between items-start mt-1 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-bold text-slate-700 uppercase truncate" title={req.name}>{req.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate" title={req.designation}>{req.designation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-medium text-slate-600">Mgr: <span className="truncate max-w-[60px] inline-block align-bottom" title={req.manager}>{req.manager.split(' ')[0]}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                <div className="min-w-0">
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5 truncate">From</p>
                  <p className="text-[11px] font-medium text-slate-700 truncate" title={formatUIDate(req.from)}>{formatUIDate(req.from)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5 truncate">To</p>
                  <p className="text-[11px] font-medium text-slate-700 truncate" title={formatUIDate(req.to)}>{formatUIDate(req.to)}</p>
                </div>
                <div className="min-w-0 text-center">
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5 truncate">Days</p>
                  <p className="text-[11px] font-bold text-sky-600 truncate">{req.days}</p>
                </div>
              </div>

              <div className="mt-1">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Remarks</p>
                <p className="text-[11px] text-slate-600 italic truncate">{req.remarks}</p>
              </div>
              {req.proofUrl && (
                <div className="mt-1 pt-2 border-t border-slate-100">
                  <button onClick={() => setPreviewUrl(req.proofUrl)} className="text-[11px] text-sky-600 font-medium flex items-center gap-1 hover:underline w-fit">
                    <FileText size={12} /> View Proof Attachment
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="p-4 text-center text-slate-500 bg-white rounded-lg border border-slate-100 shadow-sm text-sm">
              No requests found.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto flex-1 scrollbar-hide">
          <table className="w-full border-collapse">
            <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Serial No</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Request Type</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Designation</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Mobile No</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">From</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">To</th>
                <th className="px-4 py-3 text-center text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">No.of Days</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Remarks</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Manager</th>
                <th className="px-4 py-3 text-center text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center text-[12px] font-bold text-slate-700 uppercase whitespace-nowrap">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-sm text-sky-600 whitespace-nowrap cursor-pointer hover:underline">{req.sn}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] tracking-widest uppercase border ${req.type === 'Leave Request' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      req.type === 'WFH Request' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        req.type === 'Punchmiss Request' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                      {req.type.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 uppercase whitespace-nowrap">{req.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{req.designation}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{req.mobile}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatUIDate(req.from)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatUIDate(req.to)}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-800 whitespace-nowrap">{req.days}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 italic max-w-xs truncate whitespace-nowrap">{req.remarks}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{req.manager}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                     <span className={`px-2 py-0.5 rounded text-[10px] tracking-widest uppercase border font-medium ${
                       req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                       req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                       'bg-amber-50 text-amber-600 border-amber-200'
                     }`}>
                       {req.status}
                     </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {req.proofUrl ? (
                      <button onClick={() => setPreviewUrl(req.proofUrl)} className="inline-flex items-center justify-center p-1.5 bg-sky-50 text-sky-600 rounded-md hover:bg-sky-100 transition-colors" title="View Attachment">
                        <FileText size={14} />
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar - Match Screenshot Footer */}
        <div className="px-4 py-2 border-t border-slate-200 bg-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-bold focus:outline-none focus:border-sky-500 shadow-sm"
            >
              {[10, 15, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span className="text-[12px] font-bold text-slate-500">
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30 hover:bg-slate-50 transition shadow-sm text-sky-600"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            <span className="mx-2 text-[12px] font-bold text-slate-600">Pg {currentPage}/{totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30 hover:bg-slate-50 transition shadow-sm text-sky-600"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Form Modal - Bounded within relative container */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[50] p-4 pb-safe pt-safe">
          <div className="bg-white w-[88%] sm:w-full max-w-[340px] sm:max-w-md h-auto max-h-[70vh] sm:max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">

            {/* Header - Fixed */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">{formData.type}</h2>
              <button onClick={resetFormAndClose} className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-hide">
              <form id="leaveForm" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-xs sm:text-sm text-slate-600">Request Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  >
                    {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">Name</label>
                    {currentUser?.role === 'ADMIN' ? (
                      <select
                        required
                        value={formData.userName}
                        onChange={handleNameChange}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      >
                        <option value="">Select Name</option>
                        {masterData.employees.map((e, idx) => <option key={idx} value={e.name}>{e.name}</option>)}
                      </select>
                    ) : (
                      <input
                        readOnly
                        type="text"
                        value={formData.userName}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-600"
                      />
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">ID</label>
                    <input readOnly type="text" value={formData.employeeId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-600" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">Designation</label>
                    <input readOnly type="text" value={formData.designation} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-600" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">Mobile No</label>
                    <input readOnly type="text" value={formData.mobile} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-600" />
                  </div>

                  {(formData.type === 'Leave Request' || formData.type === 'WFH Request') && (
                    <>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm text-slate-600">From</label>
                        <input required type="date" value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm text-slate-600">To</label>
                        <input required type="date" value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm text-slate-600">Days</label>
                        <input 
                          type="text" 
                          value={formData.days} 
                          onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                        />
                      </div>
                    </>
                  )}

                  {(formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-xs sm:text-sm text-slate-600">Date</label>
                      <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                    </div>
                  )}

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">Manager</label>
                    <select required value={formData.manager} onChange={handleManagerChange} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500">
                      <option value="">Select Manager</option>
                      {masterData.managers.map((m, idx) => <option key={idx} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">Number</label>
                    <input readOnly type="text" value={formData.managerId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-600" />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-xs sm:text-sm text-slate-600">Remarks</label>
                  <textarea required value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows="2" className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none" />
                </div>

                {formData.type === 'Punchmiss Request' && (
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm text-slate-600">Proof Attachment</label>
                    <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                      {formData.proofPreview ? (
                        <img src={formData.proofPreview} className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-md shadow-sm border border-slate-200" />
                      ) : (
                        <Upload className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span className="text-xs sm:text-sm font-medium text-slate-500">Upload Image</span>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer - Fixed */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-100 bg-slate-50 flex gap-2 sm:gap-3 flex-shrink-0">
              <button type="button" onClick={resetFormAndClose} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-xs sm:text-sm shadow-sm">
                Cancel
              </button>
              <button form="leaveForm" type="submit" disabled={loading} className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm">
                {loading ? (
                  <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                )}
                {loading ? 'Saving...' : 'Save Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Proof Attachment</h3>
                <p className="text-xs text-slate-500">Document preview</p>
              </div>
              <button onClick={() => setPreviewUrl(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-50 p-6 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-y-auto">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center bg-slate-50/50">
                  <img
                    src={previewUrl}
                    className="max-w-full h-auto rounded-lg shadow-md mb-4"
                    alt="Proof"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x300?text=Preview+Error';
                    }}
                  />
                  <div className="flex gap-3 w-full">
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} /> Full View
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
