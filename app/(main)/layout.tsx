import BottomTabs from '@/components/BottomTabs';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      {/* 下部タブ分の余白を確保 */}
      <div className="flex-1 pb-16">{children}</div>
      <BottomTabs />
    </div>
  );
}
