"use client";

import { useState, useEffect } from "react";
import { getDocuments, addDocument, updateDocument, deleteDocument } from "@/lib/firestore";
import { Plus, Pencil, Trash2, X, Search, GraduationCap } from "lucide-react";

interface Student {
  id: string;
  name: string;
  batch: string;
  semester: string;
  address: string;
  whatsappNo: string;
  mobileNo: string;
  parentName: string;
  parentMobileNo: string;
  destination: string;
  routePreferred: string;
}

interface Stop {
  name: string;
  time: string;
}

interface RouteData {
  id: string;
  routeName: string;
  stops: Stop[];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    name: "",
    batch: "",
    semester: "",
    address: "",
    whatsappNo: "",
    mobileNo: "",
    parentName: "",
    parentMobileNo: "",
    destination: "",
    routePreferred: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsData, routesData] = await Promise.all([
        getDocuments("students"),
        getDocuments("routes")
      ]);
      setStudents(studentsData as Student[]);
      setRoutes(routesData as RouteData[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDocument("students", editingId, formData);
      } else {
        await addDocument("students", formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteDocument("students", id);
        fetchData();
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const openEditModal = (student: Student) => {
    setFormData({
      name: student.name || "",
      batch: student.batch || "",
      semester: student.semester || "",
      address: student.address || "",
      whatsappNo: student.whatsappNo || "",
      mobileNo: student.mobileNo || "",
      parentName: student.parentName || "",
      parentMobileNo: student.parentMobileNo || "",
      destination: student.destination || "",
      routePreferred: student.routePreferred || ""
    });
    setEditingId(student.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.mobileNo.includes(searchTerm)
  );

  // Get stops for the currently selected route in the form
  const selectedRoute = routes.find(r => r.id === formData.routePreferred);
  const routeStops = selectedRoute?.stops || [];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Students</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, or remove student transport records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Batch / Sem</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Route</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      {searchTerm ? "No students found matching your search." : "No students found. Add one to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const studentRoute = routes.find(r => r.id === student.routePreferred);
                    return (
                      <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div>{student.batch}</div>
                          <div className="text-xs text-slate-400">Sem: {student.semester}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div>{student.mobileNo}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="font-medium text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded text-sm border border-blue-100">
                            {studentRoute?.routeName || "Not Assigned"}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Dest: {student.destination || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(student)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap size={20} className="text-blue-600" />
                {editingId ? "Edit Student" : "Add New Student"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="studentForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Personal Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                      <input
                        type="text"
                        required
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. 2023-2027"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                      <input
                        type="text"
                        required
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. S3"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                      <textarea
                        required
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNo}
                        onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={formData.whatsappNo}
                        onChange={(e) => setFormData({ ...formData, whatsappNo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Name</label>
                      <input
                        type="text"
                        required
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Mobile</label>
                      <input
                        type="tel"
                        required
                        value={formData.parentMobileNo}
                        onChange={(e) => setFormData({ ...formData, parentMobileNo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Transport Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Transport Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Route Preferred</label>
                      <select
                        required
                        value={formData.routePreferred}
                        onChange={(e) => setFormData({ ...formData, routePreferred: e.target.value, destination: "" })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="" disabled>Select Route</option>
                        {routes.map(route => (
                          <option key={route.id} value={route.id}>{route.routeName}</option>
                        ))}
                      </select>
                      {routes.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">Please add routes in the Routes section first.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Destination (Stop)</label>
                      {routeStops.length > 0 ? (
                        <select
                          required
                          value={formData.destination}
                          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="" disabled>Select Stop</option>
                          {routeStops.map((stop, idx) => (
                            <option key={idx} value={stop.name}>{stop.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={formData.destination}
                          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder={formData.routePreferred ? "No stops defined for this route" : "Enter destination"}
                          disabled={!!formData.routePreferred}
                        />
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-medium bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="studentForm"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-70 flex items-center justify-center shadow-sm"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  editingId ? "Save Changes" : "Add Student"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
