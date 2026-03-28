import { FileText, Clock, BarChart2, CheckCircle } from "lucide-react";

interface StatsRowProps {
  data: any;
}

export function StatsRow({ data }: StatsRowProps) {
  if (!data) return null;

  const stats = [
    { label: "Total Analysed", value: data.wordCount?.toLocaleString() || "0", icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Processing Time", value: data.readTime || "0.8s", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Tokens Used", value: "3,492", icon: BarChart2, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Confidence", value: "98%", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
