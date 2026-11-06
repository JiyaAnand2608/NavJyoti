import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Baby, Plus, QrCode, ArrowRight } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function MyChildrenPage() {
  const { user } = useAuth();
  const { childrenList, activeChildId, setActiveChildId, registerChild } = useHealthData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDob, setNewChildDob] = useState('');
  const [newChildGender, setNewChildGender] = useState('Male');

  const handleAddChild = (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildDob) return;

    registerChild({
      name: newChildName.trim(),
      dob: newChildDob,
      gender: newChildGender,
      ageMonths: 1,
      caregiverId: user ? user.id : "usr_parent_01",
      caregiverName: user ? user.name : "Sunita Sharma",
      caregiverPhone: user ? user.phone : "+91 98765 43210",
      village: user?.village || "Rampur",
      subCentre: "Rampur Sub-Centre",
      phc: "Bilaspur Primary Health Centre",
      migrationStatus: "resident",
    });

    setIsModalOpen(false);
    setNewChildName('');
    setNewChildDob('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">My Linked Children</h1>
          <p className="text-xs text-[#294B57]">
            Switch between linked family profiles and manage digital UIP child records
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Child Profile</span>
        </button>
      </div>

      {childrenList.length === 0 ? (
        <div className="p-12 text-center bg-[#FBF8F2] rounded-3xl border border-[#D8E6DA] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DDF0E3] text-[#007F68] mx-auto flex items-center justify-center">
            <Baby className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#103342]">No children linked to this account yet</h3>
            <p className="text-xs text-[#294B57]">Click below to add your child's birth details and generate their digital health pass.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-colors cursor-pointer"
          >
            Add First Child
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {childrenList.map((child) => {
            const isSelected = child.id === activeChildId;
            const administeredCount = child.doses?.filter((d) => d.status === 'administered').length || 0;
            const totalCount = child.doses?.length || 0;

            return (
              <Card
                key={child.id}
                onClick={() => setActiveChildId(child.id)}
                className={`p-5 transition-all cursor-pointer border-2 bg-[#FBF8F2] ${
                  isSelected ? 'border-[#007F68] ring-2 ring-[#007F68]/20' : 'border-[#D8E6DA] hover:border-[#007F68]/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#DDF0E3] flex items-center justify-center text-[#007F68]">
                    <Baby className="w-6 h-6" />
                  </div>
                  {isSelected ? (
                    <Badge variant="upToDate">Active Profile</Badge>
                  ) : (
                    <Badge variant="default">Click to Select</Badge>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#103342]">{child.name}</h3>
                <p className="text-xs text-[#294B57]/70 font-mono mt-0.5">ID: {child.id}</p>

                <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 space-y-1.5 text-xs text-[#294B57]">
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span className="font-semibold text-[#103342]">{child.ageMonths} Months ({child.gender})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DOB:</span>
                    <span className="font-semibold text-[#103342]">{child.dob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vaccines:</span>
                    <span className="font-semibold text-[#007F68]">{administeredCount} of {totalCount} Recorded</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#294B57]/70 font-mono flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-[#007F68]" /> Pass Ready
                  </span>
                  <span className="font-bold text-[#007F68] flex items-center gap-1">
                    Select <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Child Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register a Child">
        <form onSubmit={handleAddChild} className="space-y-4 text-xs text-[#294B57]">
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Child's Full Name</label>
            <input
              type="text"
              required
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="e.g. Riya Sharma"
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Date of Birth</label>
            <input
              type="date"
              required
              value={newChildDob}
              onChange={(e) => setNewChildDob(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Gender</label>
            <select
              value={newChildGender}
              onChange={(e) => setNewChildGender(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs"
          >
            Create Child Profile
          </button>
        </form>
      </Modal>
    </div>
  );
}
