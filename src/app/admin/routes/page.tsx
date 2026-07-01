"use client";

import { useState, useEffect, Fragment } from "react";
import { getDocuments, addDocument, updateDocument, deleteDocument } from "@/lib/firestore";
import { Plus, Pencil, Trash2, X, PlusCircle, MinusCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Stop {
  name: string;
  time: string;
}

interface RouteData {
  id: string;
  routeName: string;
  stops: Stop[];
}

const formatTime = (timeString: string) => {
  if (!timeString) return "";
  try {
    const [hoursStr, minutesStr] = timeString.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutesStr} ${ampm}`;
  } catch (e) {
    return timeString;
  }
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ routeName: string; stops: Stop[] }>({
    routeName: "",
    stops: [{ name: "", time: "" }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRouteIds, setExpandedRouteIds] = useState<Record<string, boolean>>({});

  const toggleRouteExpand = (routeId: string) => {
    setExpandedRouteIds(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await getDocuments("routes");
      // Normalize stops to handle legacy data (where stop was a string)
      const normalizedData = (data as any[]).map(route => ({
        ...route,
        stops: (route.stops || []).map((stop: any) => {
          if (typeof stop === "string") {
            return { name: stop, time: "" };
          }
          return { name: stop.name || "", time: stop.time || "" };
        })
      }));
      setRoutes(normalizedData as RouteData[]);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Filter out stops that don't have a name
    const cleanedData = {
      ...formData,
      stops: formData.stops.filter(stop => stop.name.trim() !== "")
    };

    try {
      if (editingId) {
        await updateDocument("routes", editingId, cleanedData);
      } else {
        await addDocument("routes", cleanedData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchRoutes();
    } catch (error) {
      console.error("Error saving route:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteDocument("routes", id);
        fetchRoutes();
      } catch (error) {
        console.error("Error deleting route:", error);
      }
    }
  };

  const openEditModal = (route: RouteData) => {
    setFormData({
      routeName: route.routeName,
      stops: route.stops.length ? route.stops.map(s => ({ name: s.name, time: s.time })) : [{ name: "", time: "" }]
    });
    setEditingId(route.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ routeName: "", stops: [{ name: "", time: "" }] });
    setEditingId(null);
  };

  const addStop = () => {
    setFormData({ ...formData, stops: [...formData.stops, { name: "", time: "" }] });
  };

  const removeStop = (index: number) => {
    const newStops = [...formData.stops];
    newStops.splice(index, 1);
    if (newStops.length === 0) newStops.push({ name: "", time: "" }); // keep at least one input
    setFormData({ ...formData, stops: newStops });
  };

  const updateStopName = (index: number, name: string) => {
    const newStops = [...formData.stops];
    newStops[index] = { ...newStops[index], name };
    setFormData({ ...formData, stops: newStops });
  };

  const updateStopTime = (index: number, time: string) => {
    const newStops = [...formData.stops];
    newStops[index] = { ...newStops[index], time };
    setFormData({ ...formData, stops: newStops });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Routes</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, or remove bus routes and their stops.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add Route</span>
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
                  <th className="px-6 py-4 font-medium">Route Name</th>
                  <th className="px-6 py-4 font-medium">Stops</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No routes found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  routes.map((route) => (
                    <Fragment key={route.id}>
                      <tr className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {route.routeName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                              {route.stops?.length || 0} stops
                            </span>
                            {route.stops && route.stops.length > 0 && (
                              <button
                                onClick={() => toggleRouteExpand(route.id)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100/80"
                              >
                                <span>{expandedRouteIds[route.id] ? "Hide Stops" : "Show Stops"}</span>
                                {expandedRouteIds[route.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(route)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(route.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {route.stops && route.stops.length > 0 && expandedRouteIds[route.id] && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={3} className="px-12 py-4">
                            <div className="relative border-l-2 border-blue-100 ml-2 space-y-4 py-2">
                              {route.stops.map((stop, idx) => (
                                <div key={idx} className="relative pl-6 flex justify-between items-center pr-12 max-w-md">
                                  <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[7px] top-1.5"></div>
                                  <p className="text-slate-700 text-sm font-medium">{stop.name}</p>
                                  {stop.time && (
                                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                      {formatTime(stop.time)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingId ? "Edit Route" : "Add New Route"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <form id="routeForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    value={formData.routeName}
                    onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. City Center to Campus"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Route Stops</label>
                    <button
                      type="button"
                      onClick={addStop}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded-md"
                    >
                      <PlusCircle size={14} /> Add Stop
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-none flex items-center justify-center w-6 text-xs font-medium text-slate-400">
                          {index + 1}.
                        </div>
                        <input
                          type="text"
                          required
                          value={stop.name}
                          onChange={(e) => updateStopName(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                          placeholder="Stop Name"
                        />
                        <input
                          type="time"
                          required
                          value={stop.time}
                          onChange={(e) => updateStopTime(index, e.target.value)}
                          className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                          placeholder="Time"
                        />
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    ))}
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
                form="routeForm"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70 flex items-center justify-center shadow-sm"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  editingId ? "Save Changes" : "Add Route"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
