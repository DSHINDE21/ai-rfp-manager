import { Box, Flex, VStack, HStack, Link, Text, Container } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/create-rfp', label: 'Create RFP' },
    { path: '/vendors', label: 'Vendors' },
    { path: '/proposals', label: 'Proposals' },
  ]

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" shadow="sm">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" color="blue.600">
              RFP Management System
            </Text>
            <HStack spacing={6}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  as={RouterLink}
                  to={item.path}
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontWeight={location.pathname === item.path ? 'bold' : 'normal'}
                  color={location.pathname === item.path ? 'blue.600' : 'gray.600'}
                  bg={location.pathname === item.path ? 'blue.50' : 'transparent'}
                  _hover={{
                    bg: 'blue.50',
                    color: 'blue.600',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </HStack>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  )
}

export default Layout

