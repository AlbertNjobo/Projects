'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const editPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(200, 'Question must be less than 200 characters'),
  options: z.array(z.object({
    text: z.string().min(1, 'Option cannot be empty').max(100, 'Option must be less than 100 characters')
  })).min(2, 'At least 2 options required').max(10, 'Maximum 10 options allowed')
})

type FormData = z.infer<typeof editPollSchema>

interface Poll {
  id: string
  question: string
  options: Array<{
    id: string
    text: string
    position: number
  }>
}

export default function EditPollPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPoll, setIsLoadingPoll] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const pollId = params?.id as string

  const form = useForm<FormData>({
    resolver: zodResolver(editPollSchema),
    defaultValues: {
      question: '',
      options: [
        { text: '' },
        { text: '' }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options'
  })

  useEffect(() => {
    if (pollId) {
      fetchPoll()
    }
  }, [pollId])

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}`)
      
      if (response.status === 401) {
        router.push('/auth/login')
        return
      }
      
      if (response.status === 403) {
        setError('You do not have permission to edit this poll')
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch poll')
      }
      
      const data = await response.json()
      const poll: Poll = data.poll
      
      // Populate form with existing poll data
      form.reset({
        question: poll.question,
        options: poll.options
          .sort((a, b) => a.position - b.position)
          .map(option => ({ text: option.text }))
      })
    } catch (error) {
      console.error('Error fetching poll:', error)
      setError('Failed to load poll')
    } finally {
      setIsLoadingPoll(false)
    }
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: data.question,
          options: data.options.map(option => option.text)
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update poll')
      }

      // Show success message
      setShowSuccess(true)
      
      // Redirect to polls dashboard after a brief delay
      setTimeout(() => {
        router.push('/polls')
      }, 1500)
    } catch (error) {
      console.error('Error updating poll:', error)
      form.setError('root', {
        message: error instanceof Error ? error.message : 'An error occurred while updating the poll',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addOption = () => {
    if (fields.length < 10) {
      append({ text: '' })
    }
  }

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index)
    }
  }

  if (isLoadingPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Error</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button asChild>
                  <Link href="/polls">Back to Polls</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/polls" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to polls
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Poll</h1>
            <p className="text-gray-600 mt-2">
              Update your poll question and options
            </p>
          </div>

          {showSuccess ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Poll Updated Successfully!</h3>
                <p className="text-gray-600 mb-4">
                  Your poll has been updated and is ready to collect responses.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to your polls dashboard...
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Poll Details</CardTitle>
                <CardDescription>
                  Update your poll question and options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Question Field */}
                  <div className="space-y-2">
                    <Label htmlFor="question">Poll Question</Label>
                    <Input
                      id="question"
                      placeholder="What would you like to ask?"
                      {...form.register('question')}
                      className="text-base"
                    />
                    {form.formState.errors.question && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.question.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {form.watch('question')?.length || 0}/200 characters
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Poll Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        disabled={fields.length >= 10}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              {...form.register(`options.${index}.text`)}
                              className="text-base"
                            />
                            {form.formState.errors.options?.[index]?.text && (
                              <p className="text-sm text-red-600 mt-1">
                                {form.formState.errors.options[index]?.text?.message}
                              </p>
                            )}
                          </div>
                          {fields.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {form.formState.errors.options?.root && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.options.root.message}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {fields.length}/10 options • Minimum 2 required
                    </p>
                  </div>

                  {/* Error Message */}
                  {form.formState.errors.root && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">
                        {form.formState.errors.root.message}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Updating...' : 'Update Poll'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}