import { NewPatientSubmissions } from "./components/new-patient-submissions";

export function DashboardContainer({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Registrations"
          value={dashboardData.stats.unreadMessages}
          icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
          deltaType="increase"
          deltaValue="12.5%"
        />
        <StatCard
          title="Total Patients"
          value={dashboardData.stats.totalPatients.toString()}
          trend={dashboardData.stats.patientTrend}
          icon="users"
        />
        <StatCard
          title="Appointments Today"
          value={dashboardData.stats.appointmentsToday.toString()}
          trend={dashboardData.stats.appointmentTrend}
          icon="calendar"
        />
        <StatCard
          title="Recovery Rate"
          value={`${dashboardData.stats.recoveryRate}%`}
          trend={dashboardData.stats.recoveryTrend}
          icon="activity"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <AppointmentList appointments={dashboardData.appointments} />
        </div>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Patient Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={dashboardData.activityData} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <DemographicsChart data={dashboardData.demographicsData} />
          </CardContent>
        </Card>
        <div className="lg:col-span-3">
          <NewPatientSubmissions pendingRegistrations={dashboardData.messages} />
        </div>
      </div>
    </div>
  );
} 