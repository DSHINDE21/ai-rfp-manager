import request from 'supertest'
import app from '../../src/app.js'
import RFP from '../../src/models/RFP.js'
import connectDB from '../../src/config/database.js'

describe('RFP Routes', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectDB()
  })

  beforeEach(async () => {
    // Clean up test data
    await RFP.deleteMany({})
  })

  describe('POST /api/rfps', () => {
    it('should create a new RFP', async () => {
      const rfpData = {
        title: 'Test RFP',
        description: 'Test description',
        budget: 10000,
        timeline: 30,
      }

      const response = await request(app)
        .post('/api/rfps')
        .send(rfpData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(rfpData.title)
    })

    it('should create RFP from natural language', async () => {
      const naturalLanguage = 'I need 10 laptops with 16GB RAM, budget $20,000'

      const response = await request(app)
        .post('/api/rfps')
        .send({ naturalLanguage })
        .expect(201)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/rfps', () => {
    it('should get all RFPs', async () => {
      await RFP.create({
        title: 'RFP 1',
        description: 'Description 1',
        budget: 10000,
      })

      const response = await request(app)
        .get('/api/rfps')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
  })
})

