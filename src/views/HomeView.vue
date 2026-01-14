<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const modules = [
  {
    key: 'demo',
    title: 'Demo 示例',
    description: '组件和交互 Demo',
    routeName: 'TableColumnSettingDemo',
  },
  {
    key: 'theaterVenues',
    title: '剧场 · 场馆管理',
    description: '配置剧场场馆与座位图',
    routeName: 'TheaterVenueList',
  },
  {
    key: 'theaterShows',
    title: '剧场 · 演出管理',
    description: '配置演出、场次与票档',
    routeName: 'TheaterShowList',
  },
  {
    key: 'tmsTicketingSale',
    title: 'TMS · 售票',
    description: '售票前台（TMS）',
    routeName: 'TmsTicketingSale',
  },
]

const goTo = (name: string) => {
  router.push({ name })
}

const goToMock = (name: string) => {
  const route = router.resolve({ name })
  const url = new URL(window.location.href)
  url.searchParams.set('dev', '1')
  url.hash = `#${route.fullPath}`
  window.location.href = url.toString()
}
</script>

<template>
  <div class="home-page">
    <h1 class="home-title">云端 · 模块入口</h1>
    <p class="home-subtitle">选择一个模块开始体验（真实接口）</p>
    <div class="home-modules">
      <div v-for="m in modules" :key="m.key" class="home-card" @click="goTo(m.routeName)">
        <h2 class="home-card-title">{{ m.title }}</h2>
        <p class="home-card-desc">{{ m.description }}</p>
      </div>
    </div>

    <h2 class="home-section-title">Mock 数据 · 快速体验</h2>
    <p class="home-subtitle home-subtitle-mock">
      下面的入口会携带 <code>?dev=1</code> 查询参数，使用本地 Mock 数据
    </p>
    <div class="home-modules">
      <div
        v-for="m in modules"
        :key="m.key + '-mock'"
        class="home-card home-card-mock"
        @click="goToMock(m.routeName)"
      >
        <h2 class="home-card-title">{{ m.title }}</h2>
        <p class="home-card-desc">使用 Mock 数据 · {{ m.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-page {
  padding: 32px;
}

.home-title {
  font-size: 24px;
  margin-bottom: 4px;
}

.home-subtitle {
  color: #666;
  margin-bottom: 24px;
}

.home-section-title {
  font-size: 18px;
  margin: 32px 0 4px;
}

.home-subtitle-mock {
  margin-bottom: 16px;
  font-size: 13px;
}

.home-modules {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.home-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}

.home-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-color: #1677ff;
}

.home-card-title {
  margin: 0 0 8px;
  font-size: 16px;
}

.home-card-desc {
  margin: 0;
  color: #888;
  font-size: 13px;
}

.home-card-mock {
  border-style: dashed;
}
</style>
