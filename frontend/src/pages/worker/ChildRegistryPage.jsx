import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useOffline } from '../../contexts/OfflineContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Plus,
  ChevronRight,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Baby,
  Filter,
  RefreshCw,
  Phone,
  Building,
  UserCheck
} from 'lucide-react';

export function ChildRegistryPage() {
  const { childrenList, registerChild, updateChild } = useHealthData();
  const { effectiveOffline } = useOffline();
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all'); // 'all' | '0-6' | '6-12' | '12-24' | '24+'
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedChildForEdit, setSelectedChildForEdit] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New child form
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [village, setVillage] = useState('Rampur');
  const [birthWeightKg, setBirthWeightKg] = useState('3.1');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [migrationStatus, setMigrationStatus] = useState('resident');
  const [assignedWorker, setAssignedWorker] = useState('Rekha Devi (ANM)');
  const [errors, setErrors] = useState({});

  // Edit child form
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editCaregiverName, setEditCaregiverName] = useState('');
  const [editCaregiverPhone, setEditCaregiverPhone] = useState('');
  const [editVillage, setEditVillage] = useState('Rampur');
  const [editBirthWeight, setEditBirthWeight] = useState('3.1');
  const [editBloodGroup, setEditBloodGroup] = useState('B+');
  const [editAssignedWorker, setEditAssignedWorker] = useState('Rekha Devi (ANM)');
  const [editMigrationStatus, setEditMigrationStatus] = useState('resident');
  const [editErrors, setEditErrors] = useState({});

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const filteredChildren = childrenList.filter((child) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      child.name?.toLowerCase().includes(term) ||
      child.id?.toLowerCase().includes(term) ||
      child.caregiverName?.toLowerCase().includes(term) ||
      child.caregiverPhone?.replace(/\s+/g, '').includes(term.replace(/\s+/g, '')) ||
      child.village?.toLowerCase().includes(term);

    const matchesVillage = villageFilter === 'all' || child.village === villageFilter;
    const matchesPriority =
      priorityFilter === 'all'
        ? true
        : priorityFilter === 'migrant'
        ? child.migrationStatus === 'migrant_in'
        : child.priorityLevel === priorityFilter;

    let matchesAge = true;
    const age = child.ageMonths || 0;
    if (ageFilter === '0-6') matchesAge = age <= 6;
    else if (ageFilter === '6-12') matchesAge = age > 6 && age <= 12;
    else if (ageFilter === '12-24') matchesAge = age > 12 && age <= 24;
    else if (ageFilter === '24+') matchesAge = age > 24;

    return matchesSearch && matchesVillage && matchesPriority && matchesAge;
  });

  const validateRegister = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = "Child's name is required.";
    } else if (name.trim().length < 2) {
      errs.name = "Child's name must be at least 2 characters.";
    }

    if (!dob) {
      errs.dob = "Date of birth is required.";
    } else if (dob > getTodayStr()) {
      errs.dob = "Date of birth cannot be in the future.";
    }

    if (!caregiverName.trim()) {
      errs.caregiverName = "Caregiver's name is required.";
    } else if (caregiverName.trim().length < 2) {
      errs.caregiverName = "Caregiver's name must be at least 2 characters.";
    }

    const cleanPhone = caregiverPhone.replace(/[\s\-\+]/g, '');
    if (!caregiverPhone.trim()) {
      errs.caregiverPhone = "Caregiver contact phone number is required.";
    } else if (cleanPhone.length < 10) {
      errs.caregiverPhone = "Enter a valid 10-digit phone number.";
    }

    const weightNum = parseFloat(birthWeightKg);
    if (!birthWeightKg || isNaN(weightNum)) {
      errs.birthWeightKg = "Please enter a valid numeric birth weight.";
    } else if (weightNum < 0.5 || weightNum > 8.0) {
      errs.birthWeightKg = "Birth weight must be between 0.5 kg and 8.0 kg.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateEdit = () => {
    const errs = {};
    if (!editName.trim()) {
      errs.name = "Child's name is required.";
    } else if (editName.trim().length < 2) {
      errs.name = "Child's name must be at least 2 characters.";
    }

    if (!editDob) {
      errs.dob = "Date of birth is required.";
    } else if (editDob > getTodayStr()) {
      errs.dob = "Date of birth cannot be in the future.";
    }

    if (!editCaregiverName.trim()) {
      errs.caregiverName = "Caregiver's name is required.";
    } else if (editCaregiverName.trim().length < 2) {
      errs.caregiverName = "Caregiver's name must be at least 2 characters.";
    }

    const cleanPhone = editCaregiverPhone.replace(/[\s\-\+]/g, '');
    if (!editCaregiverPhone.trim()) {
      errs.caregiverPhone = "Caregiver contact phone number is required.";
    } else if (cleanPhone.length < 10) {
      errs.caregiverPhone = "Enter a valid 10-digit phone number.";
    }

    const weightNum = parseFloat(editBirthWeight);
    if (!editBirthWeight || isNaN(weightNum)) {
      errs.birthWeightKg = "Please enter a valid numeric birth weight.";
    } else if (weightNum < 0.5 || weightNum > 8.0) {
      errs.birthWeightKg = "Birth weight must be between 0.5 kg and 8.0 kg.";
    }

    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (effectiveOffline) {
      setSubmitError('Offline Mode Active: Child registration is disabled while disconnected to protect registry uniqueness. Reconnect to server before registering new children.');
      return;
    }

    if (!validateRegister()) return;

    setIsSubmitting(true);
    try {
      await registerChild({
        name: name.trim(),
        dob,
        date_of_birth: dob,
        gender,
        birthWeightKg: parseFloat(birthWeightKg),
        birth_weight_kg: parseFloat(birthWeightKg),
        bloodGroup,
        blood_group: bloodGroup,
        ageMonths: 1,
        caregiverName: caregiverName.trim(),
        caregiverPhone: caregiverPhone.trim(),
        village,
        subCentre: `${village} Sub-Centre`,
        phc: "Bilaspur Primary Health Centre",
        assignedWorker,
        migrationStatus,
      });

      setIsRegisterModalOpen(false);
      setName('');
      setDob('');
      setCaregiverName('');
      setCaregiverPhone('');
      setBirthWeightKg('3.1');
      setErrors({});
      setSuccessMsg(`Child record for "${name}" registered successfully.`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setSubmitError(err.message || 'Failed to register child record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (child, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChildForEdit(child);
    setEditName(child.name || '');
    setEditDob(child.dob || child.date_of_birth || '');
    setEditGender(child.gender || 'Male');
    setEditCaregiverName(child.caregiverName || '');
    setEditCaregiverPhone(child.caregiverPhone || '');
    setEditVillage(child.village || 'Rampur');
    setEditBirthWeight(child.birthWeightKg ? String(child.birthWeightKg) : '3.1');
    setEditBloodGroup(child.bloodGroup || 'B+');
    setEditAssignedWorker(child.assignedWorker || 'Rekha Devi (ANM)');
    setEditMigrationStatus(child.migrationStatus || 'resident');
    setEditErrors({});
    setSubmitError('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedChildForEdit) return;

    if (effectiveOffline) {
      setSubmitError('Offline Mode Active: Editing child records is disabled while disconnected to protect patient record integrity. Reconnect to server before updating records.');
      return;
    }

    if (!validateEdit()) return;

    setIsSubmitting(true);
    try {
      await updateChild(selectedChildForEdit.id, {
        name: editName.trim(),
        dob: editDob,
        date_of_birth: editDob,
        gender: editGender,
        birthWeightKg: parseFloat(editBirthWeight),
        birth_weight_kg: parseFloat(editBirthWeight),
        bloodGroup: editBloodGroup,
        blood_group: editBloodGroup,
        caregiverName: editCaregiverName.trim(),
        caregiverPhone: editCaregiverPhone.trim(),
        village: editVillage,
        subCentre: `${editVillage} Sub-Centre`,
        assignedWorker: editAssignedWorker,
        migrationStatus: editMigrationStatus,
      });

      setIsEditModalOpen(false);
      setSuccessMsg(`Child record for "${editName}" updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setSubmitError(err.message || 'Failed to update child record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Sub-Centre Child Registry
          </h1>
          <p className="text-xs text-[#294B57] mt-0.5">
            Search, filter, edit, and register 0–5 cohort children across Rampur, Kalyanpur & Shivpur
          </p>
        </div>
        <button
          onClick={() => {
            setErrors({});
            setSubmitError('');
            setIsRegisterModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Child</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, caregiver phone, or village..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="all">All Villages</option>
              <option value="Rampur">Rampur</option>
              <option value="Kalyanpur">Kalyanpur</option>
              <option value="Shivpur">Shivpur</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="all">All Statuses</option>
              <option value="red">Red (Urgent Overdue)</option>
              <option value="amber">Amber (Due in 7–14 Days)</option>
              <option value="green">Green (Up to Date)</option>
              <option value="migrant">Seasonal Migrant Families</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="all">All Ages</option>
              <option value="0-6">0–6 Months</option>
              <option value="6-12">6–12 Months</option>
              <option value="12-24">1–2 Years</option>
              <option value="24+">2+ Years</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Registry Table & Cards */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
        {filteredChildren.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#294B57] space-y-3">
            <Baby className="w-10 h-10 text-[#007F68]/50 mx-auto" />
            <p className="font-semibold text-sm text-[#103342]">No child records match your search criteria.</p>
            <p className="text-[#294B57]/70">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Child Name & ID</th>
                    <th className="py-3 px-3">DOB / Age</th>
                    <th className="py-3 px-3">Caregiver Details</th>
                    <th className="py-3 px-3">Village / Sector</th>
                    <th className="py-3 px-3">Assigned Worker</th>
                    <th className="py-3 px-3">Priority / Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                  {filteredChildren.map((child) => (
                    <tr key={child.id} className="hover:bg-[#F0EBE1]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/worker/children/${child.id}`}
                          className="font-bold text-sm text-[#103342] hover:text-[#007F68] block"
                        >
                          {child.name}
                        </Link>
                        <span className="font-mono text-[10px] text-[#007F68] font-semibold">{child.id}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-[#103342]">{child.dob || child.date_of_birth}</span>
                        <span className="block text-[10px] text-[#294B57]/70">{child.ageMonths}m ({child.gender})</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-[#103342]">{child.caregiverName}</span>
                        <a
                          href={`tel:${child.caregiverPhone?.replace(/\s+/g, '')}`}
                          className="block text-[10px] text-[#294B57]/80 font-mono hover:text-[#007F68] hover:underline"
                          title="Call Caregiver"
                        >
                          {child.caregiverPhone}
                        </a>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-[#103342]">{child.village}</span>
                        <span className="block text-[10px] text-[#294B57]/70">{child.subCentre}</span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-[#103342]">
                        {child.assignedWorker || "Rekha Devi (ANM)"}
                      </td>
                      <td className="py-3.5 px-3">
                        {child.priorityLevel === 'red' && <Badge variant="overdue">Red (Urgent)</Badge>}
                        {child.priorityLevel === 'amber' && <Badge variant="dueSoon">Amber (Due Soon)</Badge>}
                        {child.priorityLevel === 'green' && <Badge variant="upToDate">Green (Up to Date)</Badge>}
                        {child.migrationStatus === 'migrant_in' && (
                          <span className="block mt-1">
                            <Badge variant="teal">Migrant Inflow</Badge>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={(e) => handleOpenEdit(child, e)}
                          className="p-1.5 rounded-lg bg-white border border-[#D8E6DA] hover:bg-[#F0EBE1] text-[#294B57] transition-colors cursor-pointer"
                          title="Edit Child Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/worker/children/${child.id}`}
                          className="inline-flex items-center gap-1 font-bold text-[#007F68] hover:underline"
                        >
                          <span>View 360°</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="md:hidden divide-y divide-[#D8E6DA]/70">
              {filteredChildren.map((child) => (
                <div key={child.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/worker/children/${child.id}`}
                        className="font-bold text-base text-[#103342] hover:text-[#007F68]"
                      >
                        {child.name}
                      </Link>
                      <p className="font-mono text-xs text-[#007F68] font-bold mt-0.5">{child.id}</p>
                    </div>
                    <div>
                      {child.priorityLevel === 'red' && <Badge variant="overdue">Red</Badge>}
                      {child.priorityLevel === 'amber' && <Badge variant="dueSoon">Amber</Badge>}
                      {child.priorityLevel === 'green' && <Badge variant="upToDate">Green</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-[#D8E6DA]">
                    <div>
                      <span className="text-[#294B57]/70 block text-[10px]">DOB / Age:</span>
                      <span className="font-semibold text-[#103342]">{child.dob || child.date_of_birth} ({child.ageMonths}m)</span>
                    </div>
                    <div>
                      <span className="text-[#294B57]/70 block text-[10px]">Village:</span>
                      <span className="font-semibold text-[#103342]">{child.village}</span>
                    </div>
                    <div>
                      <span className="text-[#294B57]/70 block text-[10px]">Caregiver:</span>
                      <span className="font-semibold text-[#103342]">{child.caregiverName}</span>
                    </div>
                    <div>
                      <span className="text-[#294B57]/70 block text-[10px]">Phone:</span>
                      <a href={`tel:${child.caregiverPhone}`} className="font-mono text-[#007F68] underline font-semibold">
                        {child.caregiverPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={(e) => handleOpenEdit(child, e)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#D8E6DA] text-xs font-semibold text-[#103342] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <Link
                      to={`/worker/children/${child.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#007F68] text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <span>360° Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Register Child Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register Child Record (Sub-Centre)"
        subtitle="Add a newborn or migrant child to sector cohort"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs text-[#294B57]">
          {submitError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Child's Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                placeholder="e.g. Riya Verma"
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.name ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
              />
              {errors.name && <p className="text-red-600 text-[11px] mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                max={getTodayStr()}
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (errors.dob) setErrors({ ...errors, dob: null });
                }}
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.dob ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
              />
              {errors.dob && <p className="text-red-600 text-[11px] mt-1">{errors.dob}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Birth Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="8.0"
                required
                value={birthWeightKg}
                onChange={(e) => {
                  setBirthWeightKg(e.target.value);
                  if (errors.birthWeightKg) setErrors({ ...errors, birthWeightKg: null });
                }}
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.birthWeightKg ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                } text-[#103342]`}
              />
              {errors.birthWeightKg && (
                <p className="text-red-600 text-[11px] mt-1">{errors.birthWeightKg}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Caregiver Full Name *</label>
              <input
                type="text"
                required
                value={caregiverName}
                onChange={(e) => {
                  setCaregiverName(e.target.value);
                  if (errors.caregiverName) setErrors({ ...errors, caregiverName: null });
                }}
                placeholder="Mother or Father's Name"
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.caregiverName ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                } text-[#103342]`}
              />
              {errors.caregiverName && (
                <p className="text-red-600 text-[11px] mt-1">{errors.caregiverName}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Caregiver Phone *</label>
              <input
                type="tel"
                required
                value={caregiverPhone}
                onChange={(e) => {
                  setCaregiverPhone(e.target.value);
                  if (errors.caregiverPhone) setErrors({ ...errors, caregiverPhone: null });
                }}
                placeholder="+91 98765 43210"
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.caregiverPhone ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                } text-[#103342]`}
              />
              {errors.caregiverPhone && (
                <p className="text-red-600 text-[11px] mt-1">{errors.caregiverPhone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Village Sector</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="Rampur">Rampur</option>
                <option value="Kalyanpur">Kalyanpur</option>
                <option value="Shivpur">Shivpur</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Migration Status</label>
              <select
                value={migrationStatus}
                onChange={(e) => setMigrationStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="resident">Permanent Resident</option>
                <option value="migrant_in">Migrant Inflow (Temporary)</option>
                <option value="migrant_out">Seasonal Outflow</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Registering...' : 'Register Child'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Child Modal */}
      {selectedChildForEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Registry Profile: ${selectedChildForEdit.name}`}
          subtitle={`Child ID: ${selectedChildForEdit.id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs text-[#294B57]">
            {submitError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editErrors.name) setEditErrors({ ...editErrors, name: null });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    editErrors.name ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                  } text-[#103342]`}
                />
                {editErrors.name && <p className="text-red-600 text-[11px] mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  max={getTodayStr()}
                  value={editDob}
                  onChange={(e) => {
                    setEditDob(e.target.value);
                    if (editErrors.dob) setEditErrors({ ...editErrors, dob: null });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    editErrors.dob ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                  } text-[#103342]`}
                />
                {editErrors.dob && <p className="text-red-600 text-[11px] mt-1">{editErrors.dob}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Birth Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="8.0"
                  required
                  value={editBirthWeight}
                  onChange={(e) => {
                    setEditBirthWeight(e.target.value);
                    if (editErrors.birthWeightKg) setEditErrors({ ...editErrors, birthWeightKg: null });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    editErrors.birthWeightKg ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                  } text-[#103342]`}
                />
                {editErrors.birthWeightKg && (
                  <p className="text-red-600 text-[11px] mt-1">{editErrors.birthWeightKg}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Blood Group</label>
                <select
                  value={editBloodGroup}
                  onChange={(e) => setEditBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Caregiver Name *</label>
                <input
                  type="text"
                  required
                  value={editCaregiverName}
                  onChange={(e) => {
                    setEditCaregiverName(e.target.value);
                    if (editErrors.caregiverName) setEditErrors({ ...editErrors, caregiverName: null });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    editErrors.caregiverName ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                  } text-[#103342]`}
                />
                {editErrors.caregiverName && (
                  <p className="text-red-600 text-[11px] mt-1">{editErrors.caregiverName}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Caregiver Phone *</label>
                <input
                  type="tel"
                  required
                  value={editCaregiverPhone}
                  onChange={(e) => {
                    setEditCaregiverPhone(e.target.value);
                    if (editErrors.caregiverPhone) setEditErrors({ ...editErrors, caregiverPhone: null });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    editErrors.caregiverPhone ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
                  } text-[#103342]`}
                />
                {editErrors.caregiverPhone && (
                  <p className="text-red-600 text-[11px] mt-1">{editErrors.caregiverPhone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Village Sector</label>
                <select
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="Rampur">Rampur</option>
                  <option value="Kalyanpur">Kalyanpur</option>
                  <option value="Shivpur">Shivpur</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Migration Status</label>
                <select
                  value={editMigrationStatus}
                  onChange={(e) => setEditMigrationStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="resident">Permanent Resident</option>
                  <option value="migrant_in">Migrant Inflow (Temporary)</option>
                  <option value="migrant_out">Seasonal Outflow</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Saving...' : 'Save Updates'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
