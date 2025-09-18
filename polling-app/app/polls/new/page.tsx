'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const formSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(200, 'Question must be less than 200 characters'),
  options: z.array(z.object({
    text: z.string().min(1, 'Option cannot be empty').max(100, 'Option must be less than 100 characters')
  })).min(2, 'At least 2 options are required').max(10, 'Maximum 10 options allowed')
})

type FormData = z.infer<typeof formSchema>

export default function NewPollPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: [
        { text: '' },
        { text: '' }
      ]
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
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
        throw new Error(error.error || 'Failed to create poll')
      }

      // Poll created successfully
      await response.json()
      
      // Show success message
      setShowSuccess(true)
      
      // Redirect to polls dashboard after a brief delay
      setTimeout(() => {
        router.push('/polls')
      }, 1500)
    } catch (error) {
      console.error('Error creating poll:', error)
      form.setError('root', {
        message: error instanceof Error ? error.message : 'An error occurred while creating the poll',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/polls" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to My Polls
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Poll</h1>
            <p className="text-gray-600 mt-2">Create an engaging poll and share it with your audience</p>
          </div>

          {showSuccess ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Poll Created Successfully!</h3>
                <p className="text-gray-600 mb-4">
                  Your poll has been created and is ready to collect responses.
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
                  Enter your question and at least 2 options for people to choose from
                </CardDescription>
              </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poll Question</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What would you like to ask?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Options</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ text: '' })}
                        disabled={fields.length >= 10}
                      >
                        Add Option
                      </Button>
                    </div>

                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`options.${index}.text`}
                        render={({ field: inputField }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  placeholder={`Option ${index + 1}`}
                                  {...inputField}
                                />
                                {fields.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {form.formState.errors.options && (
                    <div className="text-sm text-red-600">
                      {form.formState.errors.options.message}
                    </div>
                  )}

                  {form.formState.errors.root && (
                    <div className="text-sm text-red-600 text-center">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Poll...' : 'Create Poll'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  )
}