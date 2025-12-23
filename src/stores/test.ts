import { defineStore } from 'pinia'

// 简单的用户类型定义，仅用于示例
export interface User {
  id: number
  name: string
  email: string
  isActive: boolean
}

export interface CreateUserDto {
  name: string
  email: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  loading: boolean
  count: number
}

// 模拟接口数据：实际项目里可以替换成真实的 userApi
const mockUsers: User[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', isActive: true },
  { id: 2, name: '李四', email: 'lisi@example.com', isActive: false },
]

async function mockGetUsers(): Promise<User[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockUsers
}

async function mockCreateUser(data: CreateUserDto): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const newUser: User = {
    id: Date.now(),
    isActive: true,
    ...data,
  }
  mockUsers.push(newUser)
  return newUser
}

export const useUserStore = defineStore('user', {
  // 状态
  state: (): UserState => ({
    users: [],
    currentUser: null,
    loading: false,
    count: 0,
  }),

  // 计算属性
  getters: {
    activeUsers: (state): User[] => {
      return state.users.filter((user: User) => user.isActive)
    },

    userCount: (state): number => state.users.length,

    // 带参数的计算属性
    getUserById: (state) => {
      return (id: number) =>
        state.users.find((user: User) => user.id === id)
    },
  },

  // 操作
  actions: {
    // 同步 action
    setUsers(users: User[]): void {
      this.users = users
    },

    // 异步 action：这里直接使用模拟数据
    async fetchUsers(): Promise<void> {
      this.loading = true
      try {
        const users = await mockGetUsers()
        this.users = users
      } catch (error) {
        console.error('获取用户失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async addUser(userData: CreateUserDto): Promise<User> {
      const newUser = await mockCreateUser(userData)
      this.users.push(newUser)
      return newUser
    },

    // 修改 state 的简单示例
    increment() {
      this.count++
    },
  },
})
