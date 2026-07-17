import { useHospitalStore } from '../store/useHospitalStore';
import { useAuthStore } from '../store/useAuthStore';

export default function Doctors() {
  const { user } = useAuthStore();
  const doctors = useHospitalStore(state => state.doctors);
  const isLoading = false;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator'}</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Command Center</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Doctors</h1>
            <p className="text-sm text-muted-foreground mt-1">Staff availability · {doctors.length} on shift</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">On Shift</p>
          <div className="text-3xl font-bold text-foreground mb-2">{doctors.length}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Consulting / Surgery</p>
          <div className="text-3xl font-bold text-foreground mb-2">{doctors.filter(d => d.status === 'In Surgery').length}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Available</p>
          <div className="text-3xl font-bold text-foreground mb-2">{doctors.filter(d => d.status === 'Available').length}</div>
          <p className="text-xs font-medium text-emerald-500">Ready to assign</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">On Leave</p>
          <div className="text-3xl font-bold text-foreground mb-2">{doctors.filter(d => d.status === 'On Leave').length}</div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
        {isLoading ? (
          <div className="col-span-full text-center text-muted-foreground py-10">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-card/20 rounded-2xl border border-border border-dashed flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold text-foreground mb-2">No Doctors Registered</h3>
            <p className="text-muted-foreground text-sm max-w-md">There are currently no doctors in the system. Sign out and create a doctor account to populate this directory.</p>
          </div>
        ) : doctors.map((doctor) => (
          <div key={doctor.id} className="bg-card/40 border border-border rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src={doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`} alt={doctor.name} className="w-12 h-12 rounded-full border-2 border-background shadow-lg shadow-black/50" />
                <div>
                  <h3 className="font-bold text-foreground text-lg">{doctor.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{doctor.specialization || doctor.department}</p>
                </div>
              </div>
              <StatusBadge status={doctor.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Fee</p>
                <p className="text-lg font-semibold text-foreground">₹{doctor.consultationFee}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Exp</p>
                <p className="text-sm font-medium text-foreground pt-1">{doctor.experienceYears} Years</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Schedule</p>
              <div className="flex gap-2 mb-2 flex-wrap">
                {doctor.availableDays && doctor.availableDays.length > 0 ? (
                  doctor.availableDays.map(day => (
                    <span key={day} className="text-xs px-2 py-1 rounded bg-muted/50 text-foreground">{day.substring(0, 3)}</span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No days set</span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {doctor.availableTimes && doctor.availableTimes.length > 0 ? (
                  doctor.availableTimes.map(time => (
                    <span key={time} className="text-[10px] px-2 py-1 rounded border border-border/50 text-muted-foreground">{time}</span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground">No times set</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isAvailable = status === "Available";
  const isConsulting = status === "In Surgery";
  
  let color = "text-amber-500 bg-amber-500"; // On Leave or other
  if (isAvailable) color = "text-emerald-500 bg-emerald-500";
  if (isConsulting) color = "text-primary bg-primary";

  return (
    <div className={`flex items-center gap-1.5 ${color.split(" ")[0]} text-[10px] font-bold uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color.split(" ")[1]}`} />
      {status}
    </div>
  );
}
