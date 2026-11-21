import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Baby,
  Plus,
  QrCode,
  ArrowRight,
  Edit2,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Weight
} from 'lucide-react';

export function MyChildrenPage() {
  const { user } = useAuth();
  const {
    childrenList,
    activeChildId,
    setActiveChildId,
    registerChild,
    updateChild,
    childrenLoading,
    childrenError,
    refreshChildren,
  } = useHealthData();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);

  // Form states for Add Child
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [birthWeightKg, setBirthWeightKg] = useState('3.1');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Form states for Edit Child
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editBirthWeight, setEditBirthWeight] = useState('3.1');
  const [editBloodGroup, setEditBloodGroup] = useState('B+');
  const [editErrors, setEditErrors] = useState({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const validateAddForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = "Child's full name is required.";
    } else if (name.trim().length < 2) {
      errs.name = "Child's name must be at least 2 characters.";
    }

    if (!dob) {
      errs.dob = "Date of birth is required.";
    } else if (dob > getTodayStr()) {
      errs.dob = "Date of birth cannot be in the future.";
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

  const validateEditForm = () => {
    const errs = {};
    if (!editName.trim()) {
      errs.name = "Child's full name is required.";
    } else if (editName.trim().length < 2) {
      errs.name = "Child's name must be at least 2 characters.";
    }

    if (!editDob) {
      errs.dob = "Date of birth is required.";
    } else if (editDob > getTodayStr()) {
      errs.dob = "Date of birth cannot be in the future.";
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

  const handleAddChild = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateAddForm()) return;

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
        caregiverId: user ? user.id : "usr_parent_01",
        caregiverName: user?.name || "Sunita Sharma",
        caregiverPhone: user?.phone || "+91 98765 43210",
        village: user?.village || "Rampur",
        subCentre: "Rampur Sub-Centre",
        phc: "Bilaspur Primary Health Centre",
        migrationStatus: "resident",
      });

      setIsAddModalOpen(false);
      setName('');
      setDob('');
      setBirthWeightKg('3.1');
      setBloodGroup('B+');
      setErrors({});
      setSuccessMsg(`Child profile for "${name}" registered successfully.`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setSubmitError(err.message || "Failed to register child. Please check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (child, e) => {
    e.stopPropagation();
    setSelectedChild(child);
    setEditName(child.name || '');
    setEditDob(child.dob || child.date_of_birth || '');
    setEditGender(child.gender || 'Male');
    setEditBirthWeight(child.birthWeightKg ? String(child.birthWeightKg) : '3.1');
    setEditBloodGroup(child.bloodGroup || 'B+');
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedChild) return;

    if (!validateEditForm()) return;

    setIsEditSubmitting(true);
    try {
      await updateChild(selectedChild.id, {
        name: editName.trim(),
        dob: editDob,
        date_of_birth: editDob,
        gender: editGender,
        birthWeightKg: parseFloat(editBirthWeight),
        birth_weight_kg: parseFloat(editBirthWeight),
        bloodGroup: editBloodGroup,
        blood_group: editBloodGroup,
      });

      setIsEditModalOpen(false);
      setSuccessMsg(`Details updated for "${editName}".`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setSubmitError(err.message || "Failed to update child details.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleOpenDetails = (child, e) => {
    e.stopPropagation();
    setSelectedChild(child);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">My Linked Children</h1>
          <p className="text-xs text-[#294B57]">
            Switch active family profiles, update birth records, and view digital UIP passes
          </p>
        </div>
        <button
          onClick={() => {
            setErrors({});
            setSubmitError('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Child Profile</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {childrenLoading ? (
        <div className="p-12 text-center text-sm text-[#294B57] space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#007F68] mx-auto" />
          <p>Loading linked children profiles...</p>
        </div>
      ) : childrenError ? (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
          <p className="font-semibold text-sm">Could not load child profiles.</p>
          <p className="text-xs">{childrenError}</p>
          {refreshChildren && (
            <button
              onClick={refreshChildren}
              className="px-4 py-2 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : childrenList.length === 0 ? (
        <div className="p-12 text-center bg-[#FBF8F2] rounded-3xl border border-[#D8E6DA] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DDF0E3] text-[#007F68] mx-auto flex items-center justify-center">
            <Baby className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#103342]">No children linked to this account yet</h3>
            <p className="text-xs text-[#294B57]">Click below to add your child's birth details and generate their digital health pass.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-colors cursor-pointer"
          >
            Add First Child
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {childrenList.map((child) => {
            const isSelected = String(child.id) === String(activeChildId);
            const administeredCount = child.doses?.filter((d) => d.status === 'administered' || Boolean(d.dateAdministered)).length || 0;
            const totalCount = child.doses?.length || 0;

            return (
              <Card
                key={child.id}
                onClick={() => setActiveChildId(child.id)}
                className={`p-5 transition-all cursor-pointer border-2 bg-[#FBF8F2] flex flex-col justify-between ${
                  isSelected ? 'border-[#007F68] ring-2 ring-[#007F68]/20 shadow-xs' : 'border-[#D8E6DA] hover:border-[#007F68]/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#DDF0E3] flex items-center justify-center text-[#007F68]">
                      <Baby className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenEdit(child, e)}
                        className="p-1.5 rounded-lg bg-white border border-[#D8E6DA] hover:bg-[#F0EBE1] text-[#294B57] transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDetails(child, e)}
                        className="p-1.5 rounded-lg bg-white border border-[#D8E6DA] hover:bg-[#F0EBE1] text-[#294B57] transition-colors cursor-pointer"
                        title="View Full Profile"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#103342] font-serif">{child.name}</h3>
                    {isSelected && <Badge variant="upToDate">Active</Badge>}
                  </div>
                  <p className="text-xs text-[#294B57]/70 font-mono mt-0.5">ID: {child.id}</p>

                  <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 space-y-1.5 text-xs text-[#294B57]">
                    <div className="flex justify-between">
                      <span>Age & Gender:</span>
                      <span className="font-semibold text-[#103342]">{child.ageMonths} Months ({child.gender})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date of Birth:</span>
                      <span className="font-semibold text-[#103342]">{child.dob || child.date_of_birth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blood Group:</span>
                      <span className="font-semibold text-[#103342]">{child.bloodGroup || 'B+'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UIP Vaccinations:</span>
                      <span className="font-semibold text-[#007F68]">{administeredCount} of {totalCount} Recorded</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#294B57]/70 font-mono flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-[#007F68]" /> Health Pass
                  </span>
                  <span className="font-bold text-[#007F68] flex items-center gap-1">
                    {isSelected ? "Selected Profile" : "Switch Profile"} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Child Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Child Profile"
        subtitle="Generate a new digital UIP child pass"
      >
        <form onSubmit={handleAddChild} className="space-y-4 text-xs text-[#294B57]">
          {submitError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

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
              placeholder="e.g. Aarav Sharma"
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.name ? 'border-red-400 bg-red-50/30' : 'border-[#D8E6DA] bg-white'
              } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
            />
            {errors.name && <p className="text-red-600 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
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
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
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

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer hover:bg-[#F0EBE1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Registering...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Child Modal */}
      {selectedChild && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit ${selectedChild.name}'s Details`}
          subtitle="Update demographic and birth measurements"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs text-[#294B57]">
            {submitError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

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
                } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
              />
              {editErrors.name && <p className="text-red-600 text-[11px] mt-1">{editErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
                />
                {editErrors.dob && <p className="text-red-600 text-[11px] mt-1">{editErrors.dob}</p>}
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Gender *</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  } text-[#103342] focus:ring-2 focus:ring-[#007F68]`}
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
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
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

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={isEditSubmitting}
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer hover:bg-[#F0EBE1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isEditSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Full Child Details Modal */}
      {selectedChild && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`${selectedChild.name} — Full Profile`}
          subtitle="Comprehensive Child Health Record Overview"
        >
          <div className="space-y-4 text-xs text-[#294B57]">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F0EBE1] rounded-xl border border-[#D8E6DA]">
              <div>
                <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Unique Child ID</span>
                <span className="font-mono font-bold text-[#103342]">{selectedChild.id}</span>
              </div>
              <div>
                <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Date of Birth / Age</span>
                <span className="font-semibold text-[#103342]">
                  {selectedChild.dob || selectedChild.date_of_birth} ({selectedChild.ageMonths}m old)
                </span>
              </div>
              <div>
                <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Blood Group & Gender</span>
                <span className="font-semibold text-[#103342]">
                  {selectedChild.bloodGroup || 'B+'} • {selectedChild.gender}
                </span>
              </div>
              <div>
                <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Birth Weight</span>
                <span className="font-semibold text-[#103342]">{selectedChild.birthWeightKg || 3.1} kg</span>
              </div>
              <div>
                <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Assigned Village</span>
                <span className="font-semibold text-[#103342]">{selectedChild.village}</span>
              </div>
              <div>
                <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Sub-Centre / PHC</span>
                <span className="font-semibold text-[#103342]">{selectedChild.subCentre}</span>
              </div>
            </div>

            <div className="p-3 bg-[#DDF0E3] rounded-xl border border-[#A8D5B5] text-[#005F52]">
              <span className="font-bold block mb-1">Vaccination Summary</span>
              <p>
                {selectedChild.doses?.filter(d => d.status === 'administered' || Boolean(d.dateAdministered)).length} of {selectedChild.doses?.length} UIP Doses Completed.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
