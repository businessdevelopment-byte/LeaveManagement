import React, { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Save,
  ExternalLink,
  Calendar,
  Check,
  Eye,
  Camera,
  ChevronDown
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';

const REQUEST_TYPES = ['Leave Request', 'WFH Request', 'Punchmiss Request', 'Weekoff Request'];

// Robust date formatter for UI display (DD/MM/YYYY)
const formatUIDate = (dateStr) => {
  if (!dateStr || dateStr === '-' || String(dateStr).trim() === '') return '-';
  const s = String(dateStr).trim();
  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // YYYY/MM/DD or YYYY/MM/DD HH:MM:SS
  const slashMatch = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashMatch) return `${slashMatch[3]}/${slashMatch[2]}/${slashMatch[1]}`;
  // YYYY-MM-DD or ISO
  const dashMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) return `${dashMatch[3]}/${dashMatch[2]}/${dashMatch[1]}`;
  return s;
};

// Convert to YYYY-MM-DD for standard date inputs
const toInputDate = (dateStr) => {
  if (!dateStr || dateStr === '-' || String(dateStr).trim() === '') return '';
  const s = String(dateStr).trim();
  const slashMatch = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
  const ddMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMatch) return `${ddMatch[3]}-${ddMatch[2]}-${ddMatch[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
};

// Reusable Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder, className, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openUp, setOpenUp] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // If bottom of the dropdown (approx 300px) would exceed viewport, or if it's in the bottom 40% of screen
        const spaceBelow = viewportHeight - rect.bottom;
        const wouldFitBelow = spaceBelow > 280;
        const spaceAbove = rect.top;

        setOpenUp(!wouldFitBelow && spaceAbove > spaceBelow);
      }
    }
    setIsOpen(!isOpen);
  };

  const filteredOptions = options.filter(opt =>
    String(opt.label || opt).toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => (opt.value || opt) === value);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        onClick={handleToggle}
        className={`w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] flex items-center justify-between cursor-pointer transition-all h-9 ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'bg-white hover:border-sky-400'}`}
      >
        <span className={`truncate mr-1 ${!selectedOption ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
          {selectedOption ? (selectedOption.label || selectedOption) : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute z-[110] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-200 ${openUp ? 'bottom-full mb-1 slide-in-from-bottom-1' : 'top-full mt-1 slide-in-from-top-1'}`}>
          {/* Search bar at top if opening down, at bottom if opening up */}
          {!openUp && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-40 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => {
                const val = opt.value || opt;
                const lab = opt.label || opt;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      onChange({ target: { value: val } });
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-sky-50 transition-colors ${val === value ? 'bg-sky-100/50 text-sky-700 font-medium' : 'text-slate-600'}`}
                  >
                    {lab}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-xs text-slate-400 text-center italic">No results found</div>
            )}
          </div>

          {openUp && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function LeaveRequest() {
  const { user: currentUser } = useAuthStore();
  const userRole = String(currentUser?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER ADMIN';
  const isSuperAdmin = userRole === 'SUPER ADMIN';
  const fileInputRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  // 'pending' or 'history'
  const [showFormModal, setShowFormModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // States for bulk approval
  const [selectedRows, setSelectedRows] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [draftRemarks, setDraftRemarks] = useState({});
  const [draftDates, setDraftDates] = useState({});

  const [masterData, setMasterData] = useState({ employees: [], managers: [] });

  const isAdmInit = isAdmin;
  const [formData, setFormData] = useState({
    type: 'Leave Request',
    userName: isAdmInit ? '' : (currentUser?.name || ''), // Column C
    employeeId: isAdmInit ? '' : (currentUser?.employeeCode || ''), // Column G
    designation: isAdmInit ? '' : (currentUser?.designation || ''), // Column F
    mobile: isAdmInit ? '' : (currentUser?.mobile || ''), // Column D
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
    manager: '',
    employeeName: ''
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
        // Data starts from Row 7 (index 6)
        const rows = json.data.slice(6);
        const reqs = [];

        rows.forEach((r, idx) => {
          // Column B (index 1) = SN — present means row was submitted
          // Column P (index 15) = Approval Timestamp — set by backend on approval
          const hasSN = String(r[1] || '').trim() !== '';
          const colP = String(r[15] || '').trim();

          const isPending = hasSN && colP === '';
          const isHistory = hasSN && colP !== '';

          if (isPending || isHistory) {
            reqs.push({
              id: String(r[1] || `row-${idx}`), // Serial No as ID (Column B)
              timestamp: String(r[0] || ''), // A
              sn: String(r[1] || ''), // B
              type: String(r[2] || ''), // C
              employeeId: String(r[3] || ''), // D
              name: String(r[4] || ''), // E
              designation: String(r[5] || ''), // F
              mobile: String(r[6] || ''), // G
              from: String(r[7] || ''), // H
              to: String(r[8] || ''), // I
              days: String(r[9] || ''), // J
              manager: String(r[10] || ''), // K
              managerId: String(r[11] || ''), // L
              remarks: String(r[12] || ''), // M
              proofUrl: String(r[13] || ''), // N
              status: isPending ? 'PENDING' : String(r[17] || ''), // R
              approverRemarks: String(r[19] || ''), // T
              approvedName: String(r[18] || '')     // S — Approver name
            });
          }
        });
        setRequests(reqs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load requests');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchMasterData = async () => {
    if (masterData.employees.length > 0) return;
    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      const res = await fetch(`${scriptUrl}?sheet=${import.meta.env.VITE_LOGIN_SHEET || 'Login'}`);
      const json = await res.json();

      if (json.success) {
        // Skip header row (index 0)
        const rows = json.data.slice(1);
        const emps = [];
        const mgrs = [];

        rows.forEach(r => {
          const empName = String(r[2] || '').trim(); // C — Full Name
          const empMobile = String(r[3] || '').trim(); // D — Mobile
          const empDesig = String(r[5] || '').trim(); // F — Designation
          const empId = String(r[6] || '').trim(); // G — Employee ID (Login ID)
          const role = String(r[8] || '').trim(); // I — Role

          // All employees for the Name dropdown
          if (empName && empId) {
            emps.push({ id: empId, name: empName, designation: empDesig, mobile: empMobile });
          }

          // Managers: only rows where Role (Col I) is 'Admin' or 'Super Admin'
          const lowerRole = role.toLowerCase();
          if (empName && (lowerRole === 'admin' || lowerRole === 'super admin')) {
            mgrs.push({ name: empName, id: empMobile }); // name = Col C, id = Col D (mobile/number)
          }
        });

        setMasterData({ employees: emps, managers: mgrs });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMasterData();
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

  // Filtering Logic
  // Filtering Logic (isAdmin and isSuperAdmin defined at top)

  // For regular users: match their own employee code (or name as fallback)
  const matchesCurrentUser = (r) => {
    const userCode = String(currentUser?.employeeCode || '').trim().toLowerCase();
    const userName = String(currentUser?.name || '').trim().toLowerCase();
    const reqCode = String(r.employeeId || '').trim().toLowerCase();
    const reqName = String(r.name || '').trim().toLowerCase();
    if (userCode && reqCode) return reqCode === userCode;
    if (userName && reqName) return reqName === userName;
    return false;
  };

  // For admins: match rows where manager name (Data Col K) = admin name (Login Col C)
  //             AND manager number (Data Col L) = admin mobile (Login Col D)
  const matchesAdminAsManager = (r) => {
    const adminName = String(currentUser?.name || '').trim().toLowerCase();
    const adminMobile = String(currentUser?.mobile || '').trim().toLowerCase();
    const reqMgrName = String(r.manager || '').trim().toLowerCase();
    const reqMgrId = String(r.managerId || '').trim().toLowerCase();
    // Both must match
    return adminName && adminMobile
      ? reqMgrName === adminName && reqMgrId === adminMobile
      : adminName
        ? reqMgrName === adminName   // fallback: name only
        : false;
  };

  const pendingRequests = useMemo(() => {
    return requests.filter(r => {
      if (r.status !== 'PENDING') return false;
      if (isSuperAdmin) return true;
      return (isAdmin && matchesAdminAsManager(r)) || matchesCurrentUser(r);
    });
  }, [requests, currentUser, isAdmin, isSuperAdmin]);

  const historyRequests = useMemo(() => {
    return requests.filter(r => {
      if (r.status === 'PENDING') return false;
      if (isSuperAdmin) return true;
      return (isAdmin && matchesAdminAsManager(r)) || matchesCurrentUser(r);
    });
  }, [requests, currentUser, isAdmin, isSuperAdmin]);


  const displayRequests = useMemo(() => {
    const base = activeTab === 'pending' ? pendingRequests : historyRequests;
    return base.filter(req => {
      const q = filters.searchQuery.toLowerCase();
      if (q && !req.sn.toLowerCase().includes(q) && !req.name.toLowerCase().includes(q) && !req.type.toLowerCase().includes(q)) return false;

      const toComparisonDate = (d) => {
        if (!d || d === '-') return null;
        const s = String(d).trim().replace(/\//g, '-');
        // If YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        // If DD-MM-YYYY
        const m = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        return s;
      };

      const reqDate = toComparisonDate(req.from);
      const fFrom = filters.fromDate; // YYYY-MM-DD
      const fTo = filters.toDate;   // YYYY-MM-DD

      if (fFrom && reqDate && reqDate < fFrom) return false;
      if (fTo && reqDate && reqDate > fTo) return false;

      if (filters.type && req.type !== filters.type) return false;
      if (filters.employeeName && req.name !== filters.employeeName) return false;
      if (filters.manager && req.manager !== filters.manager) return false;
      return true;
    });
  }, [activeTab, filters, pendingRequests, historyRequests]);


  const totalPages = Math.ceil(displayRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayRequests.slice(start, start + itemsPerPage);
  }, [displayRequests, currentPage, itemsPerPage]);

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const pageIds = paginatedRequests
      .filter(r => !matchesCurrentUser(r)) // Cannot select self
      .map(r => r.id);
    if (isChecked) {
      setSelectedRows(pageIds);
      const newDraftDates = {};
      const newDraftStatuses = {};
      paginatedRequests.forEach(r => {
        if (!matchesCurrentUser(r)) {
          newDraftDates[r.id] = { from: r.from, to: r.to, days: r.days };
          newDraftStatuses[r.id] = 'APPROVED';
        }
      });
      setDraftDates(newDraftDates);
      setDraftStatuses(newDraftStatuses);
    } else {
      setSelectedRows([]);
      setDraftStatuses({});
      setDraftRemarks({});
      setDraftDates({});
    }
  };

  const handleSelectRow = (id) => {
    const isSelected = selectedRows.includes(id);
    if (!isSelected) {
      setSelectedRows(prev => [...prev, id]);
      const req = requests.find(r => r.id === id);
      if (req) {
        setDraftDates(prev => ({ ...prev, [id]: { from: req.from, to: req.to, days: req.days } }));
        setDraftStatuses(prev => ({ ...prev, [id]: 'APPROVED' }));
      }
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
      setDraftStatuses(prev => { const n = { ...prev }; delete n[id]; return n; });
      setDraftRemarks(prev => { const n = { ...prev }; delete n[id]; return n; });
      setDraftDates(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleSaveBulk = async () => {
    if (selectedRows.length === 0) {
      toast.error('Please select rows to process');
      return;
    }

    const previousRequests = [...requests];
    const approvalUpdates = selectedRows.map(id => {
      const req = requests.find(r => r.id === id);
      const dates = draftDates[id];
      return {
        sn: id,
        status: draftStatuses[id] || 'APPROVED',
        remarks: draftRemarks[id] || '',
        approvedBy: currentUser?.name || '',  // Column S — Admin's real name (Login Col C)
        from: dates?.from,
        to: dates?.to,
        days: dates?.days
      };
    });

    // OPTIMISTIC UPDATE: Update local state instantly
    const optimisticRequests = requests.map(req => {
      const upd = approvalUpdates.find(u => u.sn === req.id);
      if (upd) {
        return {
          ...req,
          status: upd.status,
          approverRemarks: upd.remarks,
          approvedName: upd.approvedName,
          from: upd.from || req.from,
          to: upd.to || req.to,
          days: upd.days || req.days
        };
      }
      return req;
    });

    setRequests(optimisticRequests);
    setSelectedRows([]);
    toast.success(`Syncing ${selectedRows.length} updates...`, { duration: 1500 });

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'batchApprove',
          sheetName: import.meta.env.VITE_DATA_SHEET || 'Data',
          updates: JSON.stringify(approvalUpdates)
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success('System Synced');
      fetchRequests(); // Background refresh
    } catch (err) {
      console.error(err);
      setRequests(previousRequests); // Revert UI
      toast.error('Sync failed. Please try again.');
    }
  };



  const handleOpenForm = () => {
    fetchMasterData();
    setShowFormModal(true);
  };

  const resetFormAndClose = () => {
    setShowFormModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const isAdm = userRole === 'ADMIN' || userRole === 'SUPER ADMIN';
    setFormData({
      type: 'Leave Request',
      userName: isAdm ? '' : (currentUser?.name || ''), // Column C
      employeeId: isAdm ? '' : (currentUser?.employeeCode || ''), // Column G
      designation: isAdm ? '' : (currentUser?.designation || ''), // Column F
      mobile: isAdm ? '' : (currentUser?.mobile || ''), // Column D
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          proof: file,
          proofPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.type === 'Punchmiss Request' && !formData.proof) {
      toast.error('Proof Attachment is mandatory for Punchmiss Request');
      return;
    }
    
    setLoading(true);
    try {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const finalFrom = (formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') ? formData.date : formData.fromDate;

      const finalTo = (formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') ? '-' : formData.toDate;
      const finalDays = (formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') ? '-' : formData.days;

      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      let fileUrl = '';
      if (formData.type === 'Punchmiss Request' && formData.proofPreview && formData.proof) {
        const compressedBase64 = await compressImage(formData.proofPreview, 800);
        const uploadRes = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'uploadFile',
            base64Data: compressedBase64,
            fileName: `PROOF_${Date.now()}_${formData.proof.name}`,
            mimeType: 'image/jpeg',
            folderId: '1AqQOZVWGPeYy7o_PWu-SYHrXNStnZqmc'
          })
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) fileUrl = uploadJson.fileUrl;
      }

      // Column B (Index 1) is left empty; the Apps Script will generate the next unique SN
      // Columns A–N only; Column O is NOT written by the frontend
      const newRequestRow = [
        ts, '', formData.type, formData.employeeId, formData.userName, formData.designation, formData.mobile,
        finalFrom, finalTo, finalDays, formData.manager, formData.managerId, formData.remarks, fileUrl
      ];


      // OPTIMISTIC UPDATE: Add to UI instantly
      const tempId = `TEMP-${Date.now()}`;
      const optimisticNewReq = {
        id: tempId,
        sn: '...',
        timestamp: ts,
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
        status: 'PENDING',
        approverRemarks: '',
        approvedName: ''
      };

      setRequests(prev => [optimisticNewReq, ...prev]);
      resetFormAndClose();
      toast.success('Submitting...');

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

      toast.success('Request Submitted Successfully');
      setActiveTab('pending'); // Auto-switch to pending to see the new request
      fetchRequests(); // Sync final server data

    } catch (err) {
      console.error(err);
      toast.error('Sync failed');
      fetchRequests(); // Restore consistency
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-1.5 md:p-4 pb-[env(safe-area-inset-bottom)] gap-1.5 md:gap-4 overflow-y-auto overflow-x-hidden relative scrollbar-hide">




      {/* ── Header: Tabs + Search + Create ── */}
      <div className="bg-white p-1.5 md:p-3 rounded-xl border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5 md:gap-3 shadow-sm">

        {/* Row 1: Tabs (Full width on mobile) */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/80 rounded-lg lg:w-auto w-full">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 lg:flex-none py-1 md:py-2 px-2.5 md:px-4 font-medium transition-all duration-200 text-[10px] md:text-[11px] uppercase tracking-wider rounded-md whitespace-nowrap ${activeTab === 'pending'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 lg:flex-none py-1 md:py-2 px-2.5 md:px-4 font-medium transition-all duration-200 text-[10px] md:text-[11px] uppercase tracking-wider rounded-md whitespace-nowrap ${activeTab === 'history'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            History ({historyRequests.length})
          </button>
        </div>



        {/* Row 2: Search + Mobile Actions */}
        <div className="flex items-center gap-1.5 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-[11px] h-8 md:h-10 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>


          {/* Mobile Only Actions */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`flex items-center justify-center rounded-lg shadow-sm h-8 w-8 transition-all border ${showMobileFilters
                ? 'bg-sky-50 text-sky-600 border-sky-200'
                : 'bg-white border-slate-200 text-slate-500'
                }`}
            >
              <Filter size={15} />
            </button>
            {activeTab === 'pending' && isAdmin && (
              <button
                onClick={handleSaveBulk}
                disabled={selectedRows.length === 0 || isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center rounded-lg h-8 w-8 shadow-sm disabled:opacity-40"
              >
                {isSaving
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Save size={15} />}
              </button>
            )}
            <button
              onClick={() => setShowFormModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center rounded-lg h-8 w-8 shadow-sm"
            >
              <Plus size={18} />
            </button>

          </div>
        </div>


        {/* Expandable Desktop Filters */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden'} lg:flex grid-cols-2 lg:flex-row gap-2 w-full lg:w-auto items-center`}>
          <input
            type="text"
            placeholder="From Date"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            className="w-full lg:w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 h-9 transition-all font-medium"
          />
          <input
            type="text"
            placeholder="To Date"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            className="w-full lg:w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 h-9 transition-all font-medium"
          />
          <SearchableSelect
            placeholder="All Types"
            options={REQUEST_TYPES}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full lg:w-40"
          />

          {isAdmin && (
            <SearchableSelect
              placeholder="All Employees"
              options={[...new Set((activeTab === 'pending' ? pendingRequests : historyRequests).map(r => r.name).filter(n => n && n.trim() !== ''))].sort()}
              value={filters.employeeName}
              onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
              className="w-full lg:w-40"
            />
          )}

          {isAdmin && (
            <SearchableSelect
              placeholder="All Managers"
              options={[...new Set((activeTab === 'pending' ? pendingRequests : historyRequests).map(r => r.manager).filter(n => n && n.trim() !== ''))].sort()}
              value={filters.manager}
              onChange={(e) => setFilters({ ...filters, manager: e.target.value })}
              className="w-full lg:w-40"
            />
          )}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex gap-2">
          {activeTab === 'pending' && isAdmin && (
            <button
              onClick={handleSaveBulk}
              disabled={selectedRows.length === 0 || isSaving}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 px-0 rounded-lg font-medium text-[11px] shadow-sm uppercase tracking-widest disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
              title="Save Changes"
            >
              {isSaving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save size={15} />}
            </button>
          )}
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white h-10 w-10 px-0 rounded-lg font-medium text-[11px] shadow-sm uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Create Request"
          >
            <Plus size={18} />
          </button>

        </div>
      </div>

      {/* ── Data Section ── */}
      <div className="bg-white rounded-xl border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-sm">
        {isInitialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50 min-h-[300px]">

            <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-700 uppercase tracking-wide">Loading...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: High-Density All-Data Cards */}

            <div className="md:hidden flex flex-col gap-2 p-1.5 overflow-y-auto flex-1 bg-slate-50/30">
              {paginatedRequests.map((req) => (
                <div key={req.id} className={`bg-white rounded-lg border shadow-sm p-2.5 flex flex-col transition-all ${selectedRows.includes(req.id) ? 'border-sky-300 ring-1 ring-sky-200 bg-sky-50/10' : 'border-slate-200'}`}>
                  {/* Top Header: Status & SN */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      {activeTab === 'pending' && isAdmin && (
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(req.id)}
                          onChange={() => handleSelectRow(req.id)}
                          disabled={matchesCurrentUser(req)}
                          className={`w-5 h-5 rounded text-sky-600 border-slate-300 focus:ring-sky-500/20 ${matchesCurrentUser(req) ? 'opacity-30 cursor-not-allowed' : ''}`}
                        />
                      )}
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-bold text-sky-600 tracking-tight">{req.sn}</span>
                      <span className="text-[8px] text-slate-400 font-medium uppercase">{req.type}</span>
                    </div>
                  </div>

                  {/* Profile Section: Name & Designation */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                      {req.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold text-slate-800 truncate leading-tight">{req.name}</h3>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{req.designation}</p>
                    </div>
                  </div>

                  {/* Details Grid: ID, Mobile & Manager */}
                  <div className="grid grid-cols-3 gap-2 mb-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Emp ID</span>
                      <span className="text-[10px] text-slate-700 font-medium truncate">{req.employeeId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Mobile</span>
                      <span className="text-[10px] text-slate-700 font-medium truncate">{req.mobile}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Manager</span>
                      <span className="text-[10px] text-slate-700 font-medium truncate">{req.manager}</span>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="flex items-center gap-3 mb-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex-1">
                      <div className="flex justify-between items-center px-1 mb-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">From</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">To</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>{formatUIDate(req.from)}</span>
                        <div className="flex-1 mx-2 h-px bg-slate-100 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded-full text-[9px] border border-sky-100">
                            {req.days}D
                          </div>
                        </div>
                        <span>{formatUIDate(req.to)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-2 mb-3">
                    <div className="relative group">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Remarks</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed bg-white border border-slate-100 p-2 rounded-lg italic">
                        {req.remarks || <span className="text-slate-300">No remarks provided</span>}
                      </p>
                    </div>
                    {req.approverRemarks && (
                      <div>
                        <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest mb-1 block">Approver Note</span>
                        <p className="text-[11px] text-emerald-700 leading-relaxed bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg italic font-medium">
                          {req.approverRemarks}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {req.proofUrl && (
                        <button onClick={() => setPreviewUrl(req.proofUrl)} className="flex items-center gap-1.5 px-2 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-bold uppercase border border-sky-100 active:scale-95 transition-all">
                          <FileText size={12} />
                          Attachment
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {req.approvedName && (
                        <span className="text-[9px] text-slate-600 font-bold">Approved by: {req.approvedName}</span>
                      )}
                      <span className="text-[8px] text-slate-400 font-medium italic">Submitted {formatUIDate(req.timestamp)}</span>
                    </div>
                  </div>

                  {/* Admin Edit Controls (Selected Only) */}
                  {activeTab === 'pending' && isAdmin && selectedRows.includes(req.id) && (
                    <div className="mt-3 pt-3 border-t-2 border-dashed border-sky-100 flex flex-col gap-2 bg-sky-50/30 -mx-2.5 -mb-2.5 p-2.5 rounded-b-lg">
                      {/* Status + Remarks */}
                      <div className="flex gap-2">
                        <SearchableSelect
                          options={[{ value: 'APPROVED', label: 'Approve' }, { value: 'REJECTED', label: 'Reject' }]}
                          value={draftStatuses[req.id] || ''}
                          onChange={(e) => setDraftStatuses(prev => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Set Status"
                          className="flex-1"
                        />
                        <input type="text" placeholder="Approver remarks..." value={draftRemarks[req.id] || ''} onChange={(e) => setDraftRemarks(prev => ({ ...prev, [req.id]: e.target.value }))} className="flex-[2] text-[11px] border border-sky-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 h-9 bg-white font-medium" />
                      </div>

                      {/* Date Fields — adaptive by request type */}
                      {(req.type === 'Leave Request' || req.type === 'WFH Request') ? (
                        /* Leave / WFH → From + To + Days */
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 flex flex-col">
                            <span className="text-[7px] text-sky-600 font-semibold uppercase mb-0.5">From Date</span>
                            <input type="date" value={toInputDate(draftDates[req.id]?.from)} onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], from: e.target.value } }))} className="h-8 text-[10px] border border-sky-100 rounded-md px-1.5 font-medium" />
                          </div>
                          <div className="flex-1 flex flex-col">
                            <span className="text-[7px] text-sky-600 font-semibold uppercase mb-0.5">To Date</span>
                            <input type="date" value={toInputDate(draftDates[req.id]?.to)} onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], to: e.target.value } }))} className="h-8 text-[10px] border border-sky-100 rounded-md px-1.5 font-medium" />
                          </div>
                          <div className="w-14 flex flex-col">
                            <span className="text-[7px] text-sky-600 font-semibold uppercase mb-0.5">Days</span>
                            <input type="text" value={draftDates[req.id]?.days || ''} onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], days: e.target.value } }))} className="h-8 text-[11px] border border-sky-100 rounded-md text-center font-semibold" />
                          </div>
                        </div>
                      ) : (
                        /* Punchmiss / Weekoff → single Date only */
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 flex flex-col">
                            <span className="text-[7px] text-sky-600 font-semibold uppercase mb-0.5">Date</span>
                            <input type="date" value={toInputDate(draftDates[req.id]?.from)} onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], from: e.target.value } }))} className="h-8 text-[10px] border border-sky-100 rounded-md px-1.5 font-medium" />
                          </div>
                          <div className="flex-1 flex flex-col">
                            <span className="text-[7px] text-slate-400 font-semibold uppercase mb-0.5">To</span>
                            <div className="h-8 flex items-center px-2 text-[11px] text-slate-400 italic bg-slate-50 border border-slate-100 rounded-md">—</div>
                          </div>
                          <div className="w-14 flex flex-col">
                            <span className="text-[7px] text-slate-400 font-semibold uppercase mb-0.5">Days</span>
                            <div className="h-8 flex items-center justify-center text-[11px] text-slate-400 italic bg-slate-50 border border-slate-100 rounded-md">—</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>



            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto flex-1 hide-scrollbar-y">
              <table className="w-full border-collapse">
                <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {/* Admin Action Columns (at start) */}
                    {isAdmin && (
                      <>
                        <th className="px-4 py-3 text-center w-10 whitespace-nowrap border-r border-slate-100">
                          {activeTab === 'pending' && (
                            <input type="checkbox" onChange={handleSelectAll} checked={paginatedRequests.length > 0 && selectedRows.length === paginatedRequests.length} className="w-4 h-4 rounded text-sky-600 border-slate-300" />
                          )}
                          {activeTab === 'history' && <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest">#</span>}
                        </th>
                        <th className="px-4 py-3 text-center min-w-[120px] whitespace-nowrap text-[10px] font-semibold text-slate-700 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap min-w-[180px]">Approver Remarks</th>
                      </>
                    )}

                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Serial No</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Request Type</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Designation</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Employee ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Mobile No</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">From</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">To</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Days</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Remarks</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Proof</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Manager</th>

                    {/* History specific columns for everyone (Approved Name) or for non-admins (Status/Remarks) */}
                    {activeTab === 'history' && (
                      <>
                        {!isAdmin && (
                          <>
                            <th className="px-4 py-3 text-center min-w-[120px] whitespace-nowrap text-[10px] font-semibold text-slate-700 uppercase tracking-widest">Status</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap min-w-[180px]">Approver Remarks</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">Approved Name</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req, idx) => (
                    <tr key={req.id} className={`hover:bg-slate-50 transition-colors ${selectedRows.includes(req.id) ? 'bg-sky-50/50' : ''}`}>
                      {isAdmin && (
                        <>
                          <td className="px-4 py-3 text-center border-r border-slate-100">
                            {activeTab === 'pending' ? (
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(req.id)}
                                onChange={() => handleSelectRow(req.id)}
                                disabled={matchesCurrentUser(req)}
                                className={`w-4 h-4 rounded text-sky-600 border-slate-300 ${matchesCurrentUser(req) ? 'opacity-30 cursor-not-allowed' : ''}`}
                              />
                            ) : (
                              <div className="w-4 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {activeTab === 'pending' ? (
                              <SearchableSelect
                                options={[{ value: 'APPROVED', label: 'Approve' }, { value: 'REJECTED', label: 'Reject' }]}
                                value={draftStatuses[req.id] || ''}
                                onChange={(e) => setDraftStatuses(prev => ({ ...prev, [req.id]: e.target.value }))}
                                placeholder="Select"
                                disabled={!selectedRows.includes(req.id)}
                                className="w-24"
                              />
                            ) : (
                              <span className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider inline-flex border ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>{req.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap min-w-[180px]">
                            {activeTab === 'pending' ? (
                              <input type="text" placeholder="Add remarks..." value={draftRemarks[req.id] || ''} onChange={(e) => setDraftRemarks(prev => ({ ...prev, [req.id]: e.target.value }))} className={`text-[11px] border rounded px-2 py-1 w-full focus:outline-none ${selectedRows.includes(req.id) ? 'border-sky-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-50'}`} disabled={!selectedRows.includes(req.id)} />
                            ) : (
                              <div className="relative group cursor-help max-w-[200px]">
                                <div className="text-[11px] text-slate-600 italic truncate">{req.approverRemarks || '-'}</div>
                                {req.approverRemarks && req.approverRemarks.length > 20 && (
                                  <div className={`absolute z-[120] invisible group-hover:visible bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[11px] w-64 left-0 border border-slate-700 font-normal leading-relaxed break-words animate-in fade-in zoom-in duration-200 ${idx < 3 ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                                    <div className="font-bold text-sky-400 mb-1.5 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                                      <FileText size={10} />
                                      Approver Remarks
                                    </div>
                                    {req.approverRemarks}
                                    {idx < 3 ? (
                                      <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-slate-700" />
                                    ) : (
                                      <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-sm text-sky-600 hover:underline cursor-pointer whitespace-nowrap">{req.sn}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-slate-500 uppercase">{req.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{req.name}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{req.designation}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{req.employeeId}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{req.mobile}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {activeTab === 'pending' && selectedRows.includes(req.id) && isAdmin ? (
                          <input
                            type="date"
                            value={toInputDate(draftDates[req.id]?.from)}
                            onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], from: e.target.value } }))}
                            className="w-[110px] px-2 py-1 text-[11px] border border-sky-200 rounded focus:border-sky-500"
                          />
                        ) : formatUIDate(req.from)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {activeTab === 'pending' && selectedRows.includes(req.id) && isAdmin ? (
                          (req.type === 'Leave Request' || req.type === 'WFH Request') ? (
                            <input
                              type="date"
                              value={toInputDate(draftDates[req.id]?.to)}
                              onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], to: e.target.value } }))}
                              className="w-[110px] px-2 py-1 text-[11px] border border-sky-200 rounded focus:border-sky-500"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">—</span>
                          )
                        ) : formatUIDate(req.to)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-sky-600 whitespace-nowrap">
                        {activeTab === 'pending' && selectedRows.includes(req.id) && isAdmin ? (
                          (req.type === 'Leave Request' || req.type === 'WFH Request') ? (
                            <input
                              type="text"
                              value={draftDates[req.id]?.days || ''}
                              onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], days: e.target.value } }))}
                              className="w-12 px-2 py-1 text-[11px] text-center border border-sky-200 rounded"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">—</span>
                          )
                        ) : req.days}
                      </td>
                      <td className="px-4 py-3 relative group cursor-help max-w-[150px]">
                        <div className="text-xs text-slate-400 italic truncate whitespace-nowrap">{req.remarks || '-'}</div>
                        {req.remarks && req.remarks.length > 15 && (
                          <div className={`absolute z-[120] invisible group-hover:visible bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[11px] w-64 left-0 border border-slate-700 font-normal leading-relaxed break-words animate-in fade-in zoom-in duration-200 ${idx < 3 ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                            <div className="font-bold text-sky-400 mb-1.5 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                              <FileText size={10} />
                              User Remarks
                            </div>
                            {req.remarks}
                            {idx < 3 ? (
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-slate-700" />
                            ) : (
                              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {req.proofUrl ? (
                          <button
                            onClick={() => {
                              const driveId = req.proofUrl.match(/[-\w]{25,}/);
                              if (driveId) {
                                window.open(`https://drive.google.com/file/d/${driveId[0]}/view?usp=sharing`, '_blank');
                              } else {
                                window.open(req.proofUrl, '_blank');
                              }
                            }}
                            className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-600 hover:text-white transition-all shadow-sm group"
                            title="View Attachment"
                          >
                            <Eye size={16} className="group-hover:scale-110 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-medium uppercase tracking-widest">No Proof</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{req.manager}</td>
                      {activeTab === 'history' && (
                        <>
                          {!isAdmin && (
                            <>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider inline-flex border ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>{req.status}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap min-w-[180px] text-[11px] text-slate-600 italic">{req.approverRemarks || '-'}</td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{req.approvedName || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-2 border-t border-slate-200 bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SearchableSelect
                  options={[10, 15, 20, 50, 100].map(v => ({ value: v, label: v.toString() }))}
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  placeholder="Show"
                  className="w-20"
                />
                <span className="text-[12px] font-medium text-slate-500">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displayRequests.length)} of {displayRequests.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30 text-sky-600 shadow-sm"><ChevronLeft size={16} strokeWidth={3} /></button>
                <span className="mx-2 text-[12px] font-medium text-slate-600">Pg {currentPage}/{totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30 text-sky-600 shadow-sm"><ChevronRight size={16} strokeWidth={3} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Request Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg max-h-[90dvh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
            {/* Sticky Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex flex-col">
                <h2 className="text-[13px] font-semibold text-slate-800 uppercase tracking-tighter leading-none">{formData.type}</h2>
                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-1">Application Form</span>
              </div>
              <button onClick={resetFormAndClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
              <form id="leaveForm" onSubmit={handleSubmit} className="space-y-2">
                {/* Request Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Request Type <span className="text-rose-500">*</span></label>
                  <SearchableSelect
                    options={REQUEST_TYPES}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Select Type"
                  />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Full Name <span className="text-rose-500">*</span></label>
                    {isAdmInit ? (
                      <SearchableSelect
                        options={masterData.employees.map(e => ({ value: e.name, label: e.name }))}
                        value={formData.userName}
                        onChange={handleNameChange}
                        placeholder="Select Name"
                      />
                    ) : <input readOnly type="text" value={formData.userName} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-medium" />}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Employee ID <span className="text-rose-500">*</span></label>
                    <input readOnly type="text" value={formData.employeeId} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-medium" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Designation <span className="text-rose-500">*</span></label>
                    <input readOnly type="text" value={formData.designation} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-medium" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Mobile No. <span className="text-rose-500">*</span></label>
                    <input readOnly type="text" value={formData.mobile} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-medium" />
                  </div>

                  {(formData.type === 'Leave Request' || formData.type === 'WFH Request') && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">From Date <span className="text-rose-500">*</span></label>
                        <input required type="date" value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">To Date <span className="text-rose-500">*</span></label>
                        <input required type="date" value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Total Days</label>
                        <input type="text" value={formData.days} onChange={(e) => setFormData({ ...formData, days: e.target.value })} className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-600 bg-sky-50/50 text-center" />
                      </div>
                    </>
                  )}

                  {(formData.type === 'Punchmiss Request' || formData.type === 'Weekoff Request') && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Req. Date <span className="text-rose-500">*</span></label>
                      <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Manager <span className="text-rose-500">*</span></label>
                    <SearchableSelect
                      options={masterData.managers.map(m => ({ value: m.name, label: m.name }))}
                      value={formData.manager}
                      onChange={handleManagerChange}
                      placeholder="Select Manager"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">Manager ID <span className="text-rose-500">*</span></label>
                    <input readOnly type="text" value={formData.managerId} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-medium" />
                  </div>
                </div>

                {/* Remarks */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 font-medium uppercase tracking-wider px-0.5">
                    Reason / Remarks {formData.type === 'Weekoff Request' ? <span className="text-[8px] opacity-60 lowercase font-normal text-slate-400 ml-1">(Optional)</span> : <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  <textarea
                    required={formData.type !== 'Weekoff Request'}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows="2" style={{ minHeight: '44px' }}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 resize-none bg-white"
                  />
                </div>


                {/* Proof Attachment */}
                {formData.type === 'Punchmiss Request' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-0.5">Proof Attachment <span className="text-rose-500">*</span></label>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-all group bg-white"
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                      {formData.proofPreview ? (
                        <div className="relative">
                          <img src={formData.proofPreview} className="h-20 w-20 object-cover rounded-lg shadow-md border-2 border-white" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                            <Upload className="text-white w-6 h-6" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="p-3 bg-slate-50 rounded-full group-hover:bg-sky-100 transition-colors">
                            <Upload className="text-slate-400 group-hover:text-sky-600 w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 tracking-widest group-hover:text-sky-600">TAP TO UPLOAD</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Sticky Footer Actions */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
              <button
                type="button"
                onClick={resetFormAndClose}
                className="flex-1 px-4 py-2 bg-slate-50 text-slate-500 font-semibold rounded-xl hover:bg-slate-100 transition-all text-[11px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                form="leaveForm"
                type="submit"
                disabled={loading}
                className="flex-[2] px-4 py-2 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FileText size={16} />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

