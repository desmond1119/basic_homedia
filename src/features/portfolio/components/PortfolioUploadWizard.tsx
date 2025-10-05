import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PhotoIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { createPortfolio, uploadPortfolioFile, addPortfolioImage, updatePortfolioData } from '../store/portfolioSlice';

export const PortfolioUploadWizard = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPortfolio, uploadProgress, createPortfolio: createState } = useAppSelector((state) => state.portfolio);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    areaSqft: '',
    totalCost: '',
    currency: 'HKD',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 30) {
      alert(t('portfolio.upload.maxFilesError'));
      return;
    }

    const newFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (coverIndex === index) setCoverIndex(0);
    if (coverIndex > index) setCoverIndex(coverIndex - 1);
  };

  const handleStep1Submit = async () => {
    if (!user) return;

    const result = await dispatch(createPortfolio({
      userId: user.id,
      data: {
        title: formData.title,
        address: formData.address,
        areaSqft: formData.areaSqft ? Number(formData.areaSqft) : undefined,
        totalCost: formData.totalCost ? Number(formData.totalCost) : undefined,
        currency: formData.currency,
        description: formData.description,
      },
    }));

    if (createPortfolio.fulfilled.match(result)) {
      setStep(2);
    }
  };

  const handleStep2Submit = async () => {
    if (!currentPortfolio || !user) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const uploadResult = await dispatch(uploadPortfolioFile({
        file: selectedFiles[i],
        userId: user.id,
      }));

      if (uploadPortfolioFile.fulfilled.match(uploadResult)) {
        await dispatch(addPortfolioImage({
          portfolioId: currentPortfolio.id,
          imageUrl: uploadResult.payload,
          displayOrder: i,
          fileType: selectedFiles[i].type.startsWith('video/') ? 'video' : 'image',
        }));
      }
    }

    if (previews[coverIndex]) {
      const coverFile = selectedFiles[coverIndex];
      const coverUpload = await dispatch(uploadPortfolioFile({
        file: coverFile,
        userId: user.id,
      }));

      if (uploadPortfolioFile.fulfilled.match(coverUpload)) {
        await dispatch(updatePortfolioData({
          portfolioId: currentPortfolio.id,
          data: { coverImageUrl: coverUpload.payload },
        }));
      }
    }

    setStep(3);
  };

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                animate={{
                  scale: step === s ? 1.2 : 1,
                  backgroundColor: step >= s ? '#ffffff' : '#374151',
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold"
              >
                {step > s ? <CheckCircleIcon className="w-6 h-6" /> : s}
              </motion.div>
              {s < 3 && (
                <div className={`w-24 h-1 mx-2 ${step > s ? 'bg-white' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">{t('portfolio.upload.step1Title')}</h2>
              
              <div className="space-y-6 bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('portfolio.upload.title')} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('portfolio.upload.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('portfolio.upload.areaSqft')}
                    </label>
                    <input
                      type="number"
                      value={formData.areaSqft}
                      onChange={(e) => setFormData(prev => ({ ...prev, areaSqft: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('portfolio.upload.totalCost')}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white"
                      >
                        <option value="HKD">HKD</option>
                        <option value="USD">USD</option>
                        <option value="CNY">CNY</option>
                      </select>
                      <input
                        type="number"
                        value={formData.totalCost}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('portfolio.upload.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStep1Submit}
                  disabled={!formData.title || createState.status === 'pending'}
                  className="w-full px-6 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('portfolio.upload.next')}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">{t('portfolio.upload.step2Title')}</h2>

              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <label className="block w-full aspect-video border-2 border-dashed border-gray-700 rounded-xl hover:border-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFilesSelect}
                    className="hidden"
                  />
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <PhotoIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg">{t('portfolio.upload.dropFiles')}</p>
                    <p className="text-sm mt-2">{t('portfolio.upload.maxFiles', { count: 30 })}</p>
                  </div>
                </label>

                {previews.length > 0 && (
                  <div className="mt-8">
                    <p className="text-white mb-4">{t('portfolio.upload.selectCover')}</p>
                    <div className="grid grid-cols-4 gap-4">
                      {previews.map((preview, index) => (
                        <div
                          key={index}
                          onClick={() => setCoverIndex(index)}
                          className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
                            coverIndex === index ? 'ring-4 ring-white' : ''
                          }`}
                        >
                          <img src={preview} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          {coverIndex === index && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <span className="text-white font-bold">{t('portfolio.upload.cover')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStep2Submit}
                  disabled={selectedFiles.length === 0}
                  className="w-full mt-8 px-6 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadProgress > 0 ? `${uploadProgress}%` : t('portfolio.upload.upload')}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">{t('portfolio.upload.success')}</h2>
              <p className="text-gray-400 mb-8">{t('portfolio.upload.pendingApproval')}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/provider/portfolios'}
                className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100"
              >
                {t('portfolio.upload.viewPortfolios')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
