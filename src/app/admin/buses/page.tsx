"use client";

import { useState, useEffect } from "react";
import { getDocuments, addDocument, updateDocument, deleteDocument } from "@/lib/firestore";
import { Plus, Pencil, Trash2, X, Map as MapIcon, Users } from "lucide-react";

interface Bus {
  id: string;
  busNumber: string;
  driverId: string;
  routeId: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Route {
  id: string;
  routeName: string;
}

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ busNumber: "", driverId: "", routeId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [busesData, driversData, routesData] = await Promise.all([
        getDocuments("buses"),
        getDocuments("drivers"),
        getDocuments("routes")
      ]);
      setBuses(busesData as Bus[]);
      setDrivers(driversData as Driver[]);
      setRoutes(routesData as Route[]);
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
        await updateDocument("buses", editingId, formData);
      } else {
        await addDocument("buses", formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData(); // refresh buses list
    } catch (error) {
      console.error("Error saving bus:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bus?")) {
      try {
        await deleteDocument("buses", id);
        fetchData();
      } catch (error) {
        console.error("Error deleting bus:", error);
      }
    }
  };

  const openEditModal = (bus: Bus) => {
    setFormData({ busNumber: bus.busNumber, driverId: bus.driverId, routeId: bus.routeId });
    setEditingId(bus.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ busNumber: "", driverId: "", routeId: "" });
    setEditingId(null);
  };

  const getDriverName = (id: string) => {
    return drivers.find(d => d.id === id)?.name || "Unknown Driver";
  };

  const getRouteName = (id: string) => {
    return routes.find(r => r.id === id)?.routeName || "Unknown Route";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Buses</h1>
          <p className="text-slate-500 text-sm mt-1">Assign buses to routes and drivers.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add Bus</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="px-6 py-4 font-medium">Bus Number</th>
                  <th className="px-6 py-4 font-medium">Assigned Driver</th>
                  <th className="px-6 py-4 font-medium">Assigned Route</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No buses found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  buses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 bg-blue-50 text-blue-700 inline-block px-3 py-1 rounded-md border border-blue-100">
                          {bus.busNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Users size={16} className="text-slate-400" />
                          {getDriverName(bus.driverId)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapIcon size={16} className="text-slate-400" />
                          {getRouteName(bus.routeId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(bus)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(bus.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingId ? "Edit Bus" : "Add New Bus"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bus Number</label>
                <input
                  type="text"
                  required
                  value={formData.busNumber}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                  placeholder="e.g. BUS-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Driver</label>
                <select
                  required
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="" disabled>Select a driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
                {drivers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Please add drivers first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Route</label>
                <select
                  required
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="" disabled>Select a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.routeName}</option>
                  ))}
                </select>
                {routes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Please add routes first.</p>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || drivers.length === 0 || routes.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    editingId ? "Save Changes" : "Add Bus"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
