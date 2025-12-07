import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  CheckboxGroup,
  Box,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react'
import { rfpApi, vendorApi } from '../../services/api'

const SendRFP = ({ isOpen, onClose, rfpId, onSuccess }) => {
  const [rfps, setRfps] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedRfpId, setSelectedRfpId] = useState(rfpId || '')
  const [selectedVendors, setSelectedVendors] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      const [rfpsRes, vendorsRes] = await Promise.all([
        rfpApi.getAll(),
        vendorApi.getAll(),
      ])
      setRfps(rfpsRes.data.data || rfpsRes.data)
      setVendors(vendorsRes.data.data || vendorsRes.data)
      if (rfpId) {
        setSelectedRfpId(rfpId)
      }
    } catch (err) {
      setError('Failed to load data')
    }
  }

  const handleSend = async () => {
    if (!selectedRfpId || selectedVendors.length === 0) {
      setError('Please select an RFP and at least one vendor')
      return
    }

    setSending(true)
    setError(null)

    try {
      await rfpApi.sendToVendors(selectedRfpId, selectedVendors)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
        setSuccess(false)
        setSelectedVendors([])
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send RFP')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send RFP to Vendors</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {success && (
              <Alert status="success">
                <AlertIcon />
                RFP sent successfully!
              </Alert>
            )}

            <FormControl>
              <FormLabel>Select RFP</FormLabel>
              <Select
                value={selectedRfpId}
                onChange={(e) => setSelectedRfpId(e.target.value)}
                placeholder="Choose an RFP"
              >
                {rfps.map((rfp) => (
                  <option key={rfp._id} value={rfp._id}>
                    {rfp.title}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Select Vendors</FormLabel>
              <CheckboxGroup
                value={selectedVendors}
                onChange={setSelectedVendors}
              >
                <VStack align="start" spacing={2}>
                  {vendors.map((vendor) => (
                    <Checkbox key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.email})
                    </Checkbox>
                  ))}
                </VStack>
              </CheckboxGroup>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSend}
            isLoading={sending}
            loadingText="Sending..."
            isDisabled={success}
          >
            Send RFP
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default SendRFP

