import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Search, Plus, ChevronRight, Edit2, CheckCircle2, AlertCircle, Baby, Filter } from 'lucide-react';

export function ChildRegistryPage() {
  const { childrenList, registerChild, updateChild } = useHealthData();
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all'); // 'all' | '0-6' | '6-12' | '12-24' | '24+'
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedChildForEdit, setSelectedChildForEdit] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  // Edit child form
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editCaregiverName, setEditCaregiverName] = useState('');
  const [editCaregiverPhone, setEditCaregiverPhone] = useState('');
  const [editVillage, setEditVillage] = useState('Rampur');
  const [editAssignedWorker, setEditAssignedWorker] = useState('Rekha Devi (ANM)');
  const [editMigrationStatus, setEditMigrationStatus] = useState('resident');

  const filteredChildren = childrenList.filter((child) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      child.name.toLowerCase().includes(term) ||
      child.id.toLowerCase().includes(term) ||
      child.caregiverName.toLowerCase().includes(term) ||
      child.caregiverPhone?.includes(term);

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

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !dob || !caregiverName.trim() || !caregiverPhone.trim()) {
      setErrorMsg('Please fill in all required child and caregiver fields.');
      return;
    }

    registerChild({
      name: name.trim(),
      dob,
      gender,
      birthWeightKg: Number(birthWeightKg) || 3.1,
      bloodGroup,
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
    setSuccessMsg(`Child record for "${name}" registered successfully.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenEdit = (child, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChildForEdit(child);
    setEditName(child.name);
    setEditDob(child.dob);
    setEditGender(child.gender || 'Male');
    setEditCaregiverName(child.caregiverName || '');
    setEditCaregiverPhone(child.caregiverPhone || '');
    setEditVillage(child.village || 'Rampur');
    setEditAssignedWorker(child.assignedWorker || 'Rekha Devi (ANM)');
    setEditMigrationStatus(child.migrationStatus || 'resident');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedChildForEdit) return;

    updateChild(selectedChildForEdit.id, {
      name: editName.trim(),
      dob: editDob,
      gender: editGender,
      caregiverName: editCaregiverName.trim(),
      caregiverPhone: editCaregiverPhone.trim(),
      village: editVillage,
      subCentre: `${editVillage} Sub-Centre`,
      assignedWorker: editAssignedWorker,
      migrationStatus: editMigrationStatus,
    });

    setIsEditModalOpen(false);
    setSuccessMsg(`Child record for "${editName}" updated successfully.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Sub-Centre Child Registry
          </h1>
          <p className="text-xs text-[#294B57]">
            Search, filter, edit, and register 0–5 cohort children across Rampur, Kalyanpur & Shivpur
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
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
              placeholder="Search by name, ID, or caregiver..."
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

      {/* Registry Table */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
        {filteredChildren.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#294B57] space-y-3">
            <Baby className="w-10 h-10 text-[#007F68]/50 mx-auto" />
            <p className="font-semibold text-sm text-[#103342]">No child records match your search criteria.</p>
            <p className="text-[#294B57]/70">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <span className="font-semibold text-[#103342]">{child.dob}</span>
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={(e) => handleOpenEdit(child, e)}
                        className="p-1.5 rounded-lg bg-white border border-[#D8E6DA] hover:bg-[#F0EBE1] text-[#294B57] transition-colors"
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
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Child's Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Riya Verma"
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
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
              <label className="block font-semibold text-[#103342] mb-1">Birth Wt (kg)</label>
              <input
                type="number"
                step="0.1"
                value={birthWeightKg}
                onChange={(e) => setBirthWeightKg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="O+">O+</option>
                <option value="AB+">AB+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Caregiver Name *</label>
              <input
                type="text"
                required
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                placeholder="e.g. Pooja Verma"
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Caregiver Phone *</label>
              <input
                type="tel"
                required
                value={caregiverPhone}
                onChange={(e) => setCaregiverPhone(e.target.value)}
                placeholder="+91 98112 34567"
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Village</label>
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
              <label className="block font-semibold text-[#103342] mb-1">Assigned Worker</label>
              <select
                value={assignedWorker}
                onChange={(e) => setAssignedWorker(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="Rekha Devi (ANM)">Rekha Devi (ANM)</option>
                <option value="Nirmala Devi (ANM)">Nirmala Devi (ANM)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Migration Status</label>
              <select
                value={migrationStatus}
                onChange={(e) => setMigrationStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="resident">Resident</option>
                <option value="migrant_in">Seasonal Migrant (In)</option>
                <option value="migrant_out">Temporary Transit</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
            >
              Register Child
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Child Modal */}
      {selectedChildForEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Child Record: ${selectedChildForEdit.name}`}
          subtitle={`Child ID: ${selectedChildForEdit.id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs text-[#294B57]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Caregiver Name</label>
                <input
                  type="text"
                  required
                  value={editCaregiverName}
                  onChange={(e) => setEditCaregiverName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Caregiver Phone</label>
                <input
                  type="tel"
                  required
                  value={editCaregiverPhone}
                  onChange={(e) => setEditCaregiverPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Village</label>
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
                <label className="block font-semibold text-[#103342] mb-1">Assigned Worker</label>
                <select
                  value={editAssignedWorker}
                  onChange={(e) => setEditAssignedWorker(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="Rekha Devi (ANM)">Rekha Devi (ANM)</option>
                  <option value="Nirmala Devi (ANM)">Nirmala Devi (ANM)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Migration Status</label>
                <select
                  value={editMigrationStatus}
                  onChange={(e) => setEditMigrationStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="resident">Resident</option>
                  <option value="migrant_in">Seasonal Migrant (In)</option>
                  <option value="migrant_out">Temporary Transit</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
