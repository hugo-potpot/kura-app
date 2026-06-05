const mockRecording = {
  stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
  getURI: jest.fn().mockReturnValue('file:///tmp/test.m4a'),
};

module.exports = {
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
    Recording: {
      createAsync: jest.fn().mockResolvedValue({ recording: mockRecording }),
    },
  },
};
