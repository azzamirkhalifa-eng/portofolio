import { useState } from 'react'
import AdminLayout, { type TabId } from '../../components/admin/AdminLayout'
import ProfileSection from '../../components/admin/ProfileSection'
import SkillsSection from '../../components/admin/SkillsSection'
import ProjectsSection from '../../components/admin/ProjectsSection'
import AchievementsSection from '../../components/admin/AchievementsSection'
import JourneySection from '../../components/admin/JourneySection'
import FeaturedPanel from '../../components/admin/FeaturedPanel'
import MessagesSection from '../../components/admin/MessagesSection'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'profile' && <ProfileSection />}
      {activeTab === 'skills' && <SkillsSection />}
      {activeTab === 'projects' && <ProjectsSection />}
      {activeTab === 'achievements' && <AchievementsSection />}
      {activeTab === 'journey' && <JourneySection />}
      {activeTab === 'featured' && <FeaturedPanel />}
      {activeTab === 'messages' && <MessagesSection />}
    </AdminLayout>
  )
}