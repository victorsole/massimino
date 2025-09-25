'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Video, Upload, X, Check, Share2 } from 'lucide-react'
import SocialMediaIntegration from './social_media_integration'

interface CameraCaptureProps {
  onCapture: (file: File, mediaType: 'photo' | 'video', caption?: string) => Promise<{ success: boolean; error?: string; needsReview?: boolean; mediaUrl?: string }>
  userId: string
  workoutData?: {
    exercise: string
    sets: number
    reps: number
    weight: string
    duration?: string
  }
}

export default function CameraCapture({ onCapture, userId, workoutData }: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo')
  const [isRecording, setIsRecording] = useState(false)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; error?: string; needsReview?: boolean; mediaUrl?: string } | null>(null)
  const [showSocialShare, setShowSocialShare] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: mediaType === 'video'
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCapturing(true)
      }
    } catch (error) {
      console.error('Error starting camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }, [mediaType])

  const stopCamera = useCallback(() => {
    const video = videoRef.current
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      video.srcObject = null
    }
    setIsCapturing(false)
    setIsRecording(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCapturedFile(file)
        setPreviewUrl(URL.createObjectURL(blob))
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  const startVideoRecording = useCallback(() => {
    const video = videoRef.current
    if (!video?.srcObject) return

    const stream = video.srcObject as MediaStream
    recordedChunksRef.current = []

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
        setCapturedFile(file)
        setPreviewUrl(URL.createObjectURL(blob))
        stopCamera()
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting video recording:', error)
      alert('Unable to record video. Your browser may not support this feature.')
    }
  }, [stopCamera])

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isVideo && !isImage) {
      alert('Please select an image or video file.')
      return
    }

    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMediaType(isVideo ? 'video' : 'photo')
  }, [])

  const submitCapture = useCallback(async () => {
    if (!capturedFile) return

    setUploading(true)
    setUploadStatus(null)

    try {
      const result = await onCapture(capturedFile, mediaType, caption)
      setUploadStatus(result)

      if (result.success) {
        // Show social share option for successful uploads
        if (result.mediaUrl) {
          setShowSocialShare(true)
        }

        setTimeout(() => {
          if (!showSocialShare) {
            setCapturedFile(null)
            setPreviewUrl(null)
            setCaption('')
            setUploadStatus(null)
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus({ success: false, error: 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }, [capturedFile, mediaType, caption, onCapture])

  const resetCapture = useCallback(() => {
    setCapturedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setUploadStatus(null)
    setShowSocialShare(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  return (
    <div className="space-y-4">
      {/* Media Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMediaType('photo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            mediaType === 'photo' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <Camera size={16} />
          Photo
        </button>
        <button
          onClick={() => setMediaType('video')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            mediaType === 'video' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <Video size={16} />
          Video
        </button>
      </div>

      {/* Camera View */}
      {isCapturing && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-64 object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            {mediaType === 'photo' ? (
              <button
                onClick={capturePhoto}
                className="bg-white text-black p-3 rounded-full hover:bg-gray-100"
              >
                <Camera size={24} />
              </button>
            ) : (
              <button
                onClick={isRecording ? stopVideoRecording : startVideoRecording}
                className={`p-3 rounded-full ${
                  isRecording ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                <Video size={24} />
              </button>
            )}
            <button
              onClick={stopCamera}
              className="bg-gray-500 text-white p-3 rounded-full hover:bg-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Recording...
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      {!isCapturing && !capturedFile && (
        <div className="flex gap-4">
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Camera size={16} />
            {mediaType === 'photo' ? 'Take Photo' : 'Record Video'}
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 cursor-pointer">
            <Upload size={16} />
            Upload File
            <input
              type="file"
              accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Preview and Caption */}
      {capturedFile && previewUrl && (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden">
            {mediaType === 'photo' ? (
              <img src={previewUrl} alt="Captured" className="w-full h-64 object-cover" />
            ) : (
              <video src={previewUrl} controls className="w-full h-64 object-cover" />
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your media..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                maxLength={500}
                disabled={uploading}
              />
              <div className="text-sm text-gray-500 text-right">
                {caption.length}/500
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitCapture}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Share
                  </>
                )}
              </button>

              <button
                onClick={resetCapture}
                disabled={uploading}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`p-4 rounded-lg ${
          uploadStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {uploadStatus.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Check size={16} />
                <span>Media uploaded successfully!</span>
                {uploadStatus.needsReview && (
                  <span className="text-sm">• Pending moderation review</span>
                )}
              </div>
              {uploadStatus.mediaUrl && !showSocialShare && (
                <button
                  onClick={() => setShowSocialShare(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Share2 size={14} />
                  Share to social media
                </button>
              )}
            </div>
          ) : (
            <div className="text-red-700">
              Upload failed: {uploadStatus.error}
            </div>
          )}
        </div>
      )}

      {/* Social Media Integration */}
      {showSocialShare && uploadStatus?.success && uploadStatus.mediaUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Share to Social Media</h3>
            <button
              onClick={() => setShowSocialShare(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <SocialMediaIntegration
            userId={userId}
            mediaUrl={uploadStatus.mediaUrl}
            mediaType={mediaType}
            {...(workoutData ? { workoutData } : {})}
          />
        </div>
      )}
    </div>
  )
}
