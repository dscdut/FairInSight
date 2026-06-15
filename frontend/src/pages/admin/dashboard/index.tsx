import { Cpu, Database, MessageSquare, Activity } from "lucide-react";

import { FadeUp } from "@/components/animated/animated-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useAuthStore } from "@/core/store/features/auth/authStore";


import AIAgent from "./components/ai-agent";
import HandOff from "./components/handoff";
import Knowledge from "./components/knowledge";
import Overview from "./components/overview";

const TABS_TRIGGER = [
  { value: 'overview', icon: Activity, label: 'Tổng quan hệ thống'},
  { value: 'ai-agent', icon: Cpu, label: 'Giám sát AI Agent'},
  { value: 'handoff', icon: MessageSquare, label: 'Điều phối Luật sư'},
  { value: 'knowledge', icon: Database, label: 'Pipeline tri thức'},

]

export default function Dashboard() {

  const user = useAuthStore((state) => state.user)

  return (
    <main className="p-4">
      <section>
        <FadeUp className="max-w-3xl">
          <span className='inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-medium text-white backdrop-blur-sm'>
            <span className='h-1.5 w-1.5 rounded-full bg-white animate-pulse' />
            FairInsights Admin Portal
          </span>
          <h1 className='py-4 text-h1 tracking-tight text-main'>
            Mừng trở lại, {user?.fullName || 'Admin'}!
          </h1>
        </FadeUp>
      </section>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="space-x-4 bg-transparent border-b border-secondary rounded-none h-auto p-0">
          {TABS_TRIGGER.map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value}
              className="text-small text-text-description transition-all duration-200 pb-2 rounded-none border-b-2 border-transparent bg-transparent shadow-none
                hover:text-info 
                data-[state=active]:border-b-info 
                data-[state=active]:text-info
                data-[state=active]:bg-transparent
                data-[state=active]:shadow-none
                dark:text-info dark:data-[state=active]:text-info dark:data-[state=active]:border-info"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="overview">
          <Overview/>
        </TabsContent>
        <TabsContent value="ai-agent">
          <AIAgent/>
        </TabsContent>
        <TabsContent value="handoff">
          <HandOff/>
        </TabsContent>
        <TabsContent value="knowledge">
          <Knowledge/>
        </TabsContent>
      </Tabs>
    </main>
  )
}
