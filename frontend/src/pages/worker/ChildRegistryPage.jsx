import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Search, Filter, Plus, ChevronRight, AlertTriangle, Users, QrCode } from 'lucide-react';

export function ChildRegistryPage() {
  const { childrenList, registerChild } = useHealthData();
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // New child form
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [village, setVillage] = useState('Rampur');

  const filteredChildren = childrenList.filter((child) => {
    const matchesSearch =
      child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.caregiverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVillage = villageFilter === 'all' || child.village === villageFilter;
    const matchesPriority = priorityFilter === 'all' || child.priorityLevel === priorityFilter;

    return matchesSearch && matchesVillage && matchesPriority;
  });

  const handleRegister = (e) => {
    e.preventDefault();
    registerChild({
      name,
      dob,
      gender,
      ageMonths: 2,
      caregiverName,
      caregiverPhone,
      village,
      subCentre: `${village} Sub-Centre`,
      phc: "Bilaspur Primary Health Centre",
      migrationStatus: "resident",
      doses: [
        { id: `d_${Date.now()}_1`, vaccineId: "bcg", vaccineName: "BCG", status: "administered", dateAdministered: dob, facility: `${village} SC`, workerName: "Rekha Devi (ANM)" },
        { id: `d_${Date.now()}_2`, vaccineId: "opv_0", vaccineName: "OPV 0", status: "administered", dateAdministered: dob, facility: `${village} SC`, workerName: "Rekha Devi (ANM)" },
        { id: `d_${Date.now()}_3`, vaccineId: "penta_1", vaccineName: "Pentavalent 1", status: "due_soon", dueDate: "2024-12-10", facility: `${village} SC` },
      ],
      milestones: [],
    });
    setIsRegisterModalOpen(false);
    setName('');
    setDob('');
    setCaregiverName('');
    setCaregiverPhone('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            Sub-Centre Child Registry
          </h1>
          <p className="text-xs text-slate-500">
            Search, filter, and register 0–5 cohort children across Rampur, Kalyanpur & Shivpur
          </p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#006B64] text-white text-xs font-semibold hover:bg-[#00524c] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Child</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by child name, child ID, or caregiver..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006B64]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006B64]"
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
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006B64]"
            >
              <option value="all">All Priorities</option>
              <option value="red">Red (Urgent Follow-up)</option>
              <option value="amber">Amber (Due Soon)</option>
              <option value="green">Green (Up to Date)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Children Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Child Identity & ID</th>
                <th className="py-3 px-3">DOB / Age</th>
                <th className="py-3 px-3">Caregiver Details</th>
                <th className="py-3 px-3">Village</th>
                <th className="py-3 px-3">Migration Flag</th>
                <th className="py-3 px-3">Follow-up Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredChildren.map((child) => (
                <tr key={child.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#17394A] block">{child.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{child.id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span>{child.ageMonths} Months ({child.gender})</span>
                    <span className="text-[10px] text-slate-400 block">{child.dob}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">{child.caregiverName}</span>
                    <span className="text-[10px] text-slate-400 block">{child.caregiverPhone}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800">{child.village}</span>
                  </td>
                  <td className="py-3 px-3">
                    {child.migrationStatus === 'migrant_in' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        New In-Migrant
                      </span>
                    )}
                    {child.migrationStatus === 'migrant_out' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Migrated Out
                      </span>
                    )}
                    {child.migrationStatus === 'resident' && (
                      <span className="text-slate-500 text-[11px]">Resident</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {child.priorityLevel === 'red' && <Badge variant="overdue">Red: Urgent Catch-up</Badge>}
                    {child.priorityLevel === 'amber' && <Badge variant="dueSoon">Amber: Due Soon</Badge>}
                    {child.priorityLevel === 'green' && <Badge variant="upToDate">Green: Up to Date</Badge>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/worker/children/${child.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF5F8] hover:bg-[#d8eaf5] text-[#17394A] font-semibold text-xs transition-colors"
                    >
                      <span>360° Record</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Child in Sub-Centre"
        subtitle="Generates portable digital health record and initial UIP schedule"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Child's Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Caregiver's Name</label>
              <input
                type="text"
                required
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                placeholder="Mother / Father"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={caregiverPhone}
                onChange={(e) => setCaregiverPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Village</label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="Rampur">Rampur</option>
              <option value="Kalyanpur">Kalyanpur</option>
              <option value="Shivpur">Shivpur</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00524c] transition-all cursor-pointer mt-2"
          >
            Register Child & Create Record
          </button>
        </form>
      </Modal>
    </div>
  );
}
