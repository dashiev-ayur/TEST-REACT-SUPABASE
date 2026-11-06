import { Box, Container } from '@mui/material'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%' }}>
          <LoginForm />
        </Box>
      </Box>
    </Container>
  )
}