import { useMemo, useState } from "react";

import {
  // AlertTriangle,
  // CheckCircle2,
  FileText,
  Search,
  User,
  // UserPlus,
  UserX
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, Sector, XAxis, YAxis } from "recharts";
import { type PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,

  CardFooter,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui";


const statsData = [
  { id: 1, title: 'Tổng người dùng', value: '43,520', change: '+5.2%', isPositive: true, icon: User, color: 'text-purple-600 bg-purple-50', sparklinePath: 'M 0 45 Q 30 40 60 42 T 120 48 T 180 38 T 240 32 T 300 28', sparklineGradient: 'M 0 45 Q 30 40 60 42 T 120 48 T 180 38 T 240 32 T 300 28 L 300 60 L 0 60 Z', strokeColor: '#A855F7', gradientId: 'purple-grad' },
  { id: 2, title: 'Tổng văn bản pháp luật', value: '12,840', change: '+12.5%', isPositive: true, icon: FileText, color: 'text-blue-600 bg-blue-50', sparklinePath: 'M 0 50 Q 40 48 80 35 T 160 25 T 240 18 T 300 25', sparklineGradient: 'M 0 50 Q 40 48 80 35 T 160 25 T 240 18 T 300 25 L 300 60 L 0 60 Z', strokeColor: '#3B82F6', gradientId: 'blue-grad' },
  { id: 3, title: 'Lượt tra cứu hôm nay', value: '1,240', change: '+14.8%', isPositive: true, icon: Search, color: 'text-teal-600 bg-teal-50', sparklinePath: 'M 0 48 Q 40 42 80 25 T 160 18 T 240 32 T 300 40', sparklineGradient: 'M 0 48 Q 40 42 80 25 T 160 18 T 240 32 T 300 40 L 300 60 L 0 60 Z', strokeColor: '#14B8A6', gradientId: 'teal-grad' },
  { id: 4, title: 'User đang bị khoá', value: '18', change: '-0.4%', isPositive: false, icon: UserX, color: 'text-destructive bg-destructive/10', sparklinePath: 'M 0 48 Q 30 42 60 38 T 120 45 T 180 40 T 240 25 T 300 20', sparklineGradient: 'M 0 48 Q 30 42 60 38 T 120 45 T 180 40 T 240 25 T 300 20 L 300 60 L 0 60 Z', strokeColor: '#F97316', gradientId: 'orange-grad' },
];

const weeklyTraffic = [
  { day: 'Mon', accessValue: 1200 },
  { day: 'Tue', accessValue: 2100 },
  { day: 'Wed', accessValue: 800 },
  { day: 'Thu', accessValue: 1600 },
  { day: 'Fri', accessValue: 2400 },
  { day: 'Sat', accessValue: 1100 },
  { day: 'Sun', accessValue: 500 },
];

const weeklyConfig = {
  accessValue: {
    label: `Lượt truy cập: `,
    color: "var(--info)",
  },
} satisfies ChartConfig
// const recentActivities = [
//   { id: 1, title: 'Cập nhật hệ thống dữ liệu', description: 'Hoàng Thuận đã push 3 commits vào nhánh chính', time: '2 giờ trước', icon: CheckCircle2, iconColor: 'text-blue-600 bg-blue-50' },
//   { id: 2, title: 'Thành viên mới gia nhập', description: 'Anna Lee đã tham gia đội ngũ Quản lý dự án', time: '4 giờ trước', icon: UserPlus, iconColor: 'text-green-600 bg-green-50' },
//   { id: 3, title: 'Báo cáo lỗi nghiêm trọng', description: 'Issue #402: Lỗi luồng thanh toán trên Safari', time: 'Hôm qua', icon: AlertTriangle, iconColor: 'text-destructive bg-destructive/10' },
// ];

const documentDistribution = [
  { 
    type: 'Luật & Nghị định', 
    number: 275, 
    color: '#3F3D89',
    bgClass: 'bg-[#3F3D89]'
  },
  { 
    type: 'Thông tư / Hướng dẫn', 
    number: 200, 
    color: '#0CA2F1',
    bgClass: 'bg-[#0CA2F1]'
  },
  { 
    type: 'Biểu mẫu pháp lý', 
    number: 187, 
    color: '#8F59FA',
    bgClass: 'bg-[#8F59FA]'
  },
];

const chartConfig: ChartConfig = {
  number: {
    label: "Số lượng văn bản",
  },
  "Luật & Nghị định": {
    label: "Luật & Nghị định",
    color: "#3F3D89",
  },
  "Thông tư / Hướng dẫn": {
    label: "Thông tư / Hướng dẫn",
    color: "#0CA2F1",
  },
  "Biểu mẫu pháp lý": {
    label: "Biểu mẫu pháp lý",
    color: "#8F59FA",
  },
} satisfies ChartConfig;

const monthlyNewDocuments = [
  { month: 'Tháng 3', count: 145 },
  { month: 'Tháng 4', count: 210 },
  { month: 'Tháng 5', count: 320 },
];

interface ActiveShapeProps extends PieSectorDataItem {
  fill?: string
}


export default function Overview() {

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const totalDocuments = useMemo(() => {
    return documentDistribution.reduce((acc, document) => acc + document.number, 0);
  }, []);

  return (
    <section className="space-y-8 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          return (
            <div key={stat.id} className="relative overflow-hidden rounded-2xl border border-secondary shadow-sm flex flex-col justify-between h-[160px]">
              <div className="p-6 pb-0 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-small font-medium text-text-description">{stat.title}</p>
                </div>
                <div className="flex items-baseline gap-2 mt-2 mb-1">
                  <span className="text-h2 text-main">{stat.value}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${stat.isPositive ? 'bg-green-100 text-success-primary' : 'bg-background-primaryLight text-primary'}`}>{stat.change}</span>
                </div>
              </div>
              <div className="w-full h-[50px]">
                <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={stat.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stat.strokeColor} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={stat.strokeColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={stat.sparklineGradient} fill={`url(#${stat.gradientId})`} />
                  <path d={stat.sparklinePath} fill="none" stroke={stat.strokeColor} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 2: Layout 7-3 */}
      <div className="grid gap-4 md:grid-cols-10">
        <div className="md:col-span-7 shadow-sm h-fit">
          <Card>
            <CardHeader>
              <CardTitle className="text-small text-main">Lượt truy cập 7 ngày qua</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={weeklyConfig}>
                <AreaChart
                  accessibilityLayer
                  data={weeklyTraffic}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                > 
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    style={{ fontSize: "12px", fontWeight: 500, fill: "oklch(0.35 0.048 344)" }}
                  />
                  <YAxis
                    stroke="var(--chart-2-stroke)"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `${value}`}
                    style={{ fontSize: "12px", fontWeight: 500, fill: "oklch(0.35 0.048 344)" }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelKey="day"
                        labelStyle={{ fontSize: "12px", fontWeight: 500, fill: "oklch(0.35 0.048 344)" }}
                        indicator="dot"
                        hideLabel
                      />
                    }
                    cursor={false}
                  />
                  <defs>
                    <linearGradient id="areaAccessValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="accessValue"
                    type="monotone"
                    stroke="var(--blue-500)"
                    strokeWidth={2}
                    fill="var(--blue-50)"
                    dot={{
                      r: 2,
                      strokeWidth: 2,
                      stroke: "var(--blue-500)",
                      fill: "var(--blue-500)",
                    }}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      stroke: "var(--blue-500)",
                      fill: "var(--blue-500)",
                    }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        {/* Cơ cấu */}
        <div className="md:col-span-3 space-y-6">    
          <Card>
            <CardHeader>
              <CardTitle className="text-main">Cơ cấu loại văn bản</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel/>}
                  />
                  <Pie
                    data={documentDistribution}
                    dataKey="number"
                    nameKey="type"
                    innerRadius={60}
                    strokeWidth={5}
                    activeIndex={hoveredIdx !== null ? hoveredIdx : undefined}
                    onMouseEnter={(_, index) => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    activeShape={(props: ActiveShapeProps) => {
                      const { outerRadius = 0, fill, ...rest } = props;
                      return (
                        <Sector 
                          {...rest} 
                          fill={fill}
                          outerRadius={outerRadius + 5} 
                          className="cursor-pointer transition-all duration-300 outline-none"
                        />
                      );
                    }}
                  >
                    {documentDistribution.map((document, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={document.color} 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
            <CardContent>
              {documentDistribution.map((document, index) => {
                const percentage = Math.round((document.number / totalDocuments) * 100);
                return (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${document.bgClass}`} />
                      <span className="text-sm text-main font-semibold">{document.type}</span>
                    </div>
                    <span className="text-sm text-main font-semibold">{percentage} %</span>
                  </div>
                )
              })}
            </CardContent>
            <CardFooter className="text-center text-sm">
              Tỉ lệ phần trạng danh mục trong Database hệ thống
            </CardFooter>
          </Card>

          <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-small font-semibold text-main">Văn bản mới theo tháng</h3>
              </div>
              <p className="text-sm text-muted-foreground">Lượng tài liệu pháp luật được cập nhật vào kho dữ liệu</p>
            </div>
            
            <div className="space-y-2 mt-4">
              {monthlyNewDocuments.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-secondary last:border-none">
                  <span className="text-text-description font-medium">{item.month}</span>
                  <span className="font-semibold px-2 py-0.5 bg-secondary rounded text-text-description">+{item.count} biểu mẫu</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
