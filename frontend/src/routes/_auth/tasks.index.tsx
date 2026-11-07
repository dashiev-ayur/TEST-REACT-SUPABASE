import { createFileRoute } from '@tanstack/react-router'
import { MyTasksPage } from '../../pages/MyTasksPage'


export const Route = createFileRoute('/_auth/tasks/')({
  component: MyTasksPage, 
})