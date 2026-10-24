import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { AppProvider, useApp } from './context/AppContext'
import { CookPage } from './pages/CookPage'
import { PlanPage } from './pages/PlanPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesPage } from './pages/RecipesPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShopPage } from './pages/ShopPage'

function Shell() {
  const { ready, error } = useApp()

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center font-display text-2xl text-forest">
        MealPlan…
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h1 className="font-display text-2xl text-clay">Couldn’t load</h1>
        <p className="mt-2 text-sm text-ink-muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6">
      <Routes>
        <Route path="/" element={<PlanPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/cook/:slotId" element={<CookPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}
