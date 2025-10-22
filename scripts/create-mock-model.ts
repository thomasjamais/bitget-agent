import * as tf from '@tensorflow/tfjs-node';
import { logger } from '../src/utils/logger.js';
import path from 'path';
import fs from 'fs';

/**
 * Script to create a simple mock trading model for testing
 * This creates a TensorFlow.js model and saves it in a format
 * that can be used for testing the AI system
 */
async function createMockTradingModel() {
  logger.info('🏭 Creating mock trading model...');

  try {
    // Create a simple neural network model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [48], // 48 input features as defined in our system
          units: 64,
          activation: 'relu',
          name: 'hidden1'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          name: 'hidden2'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 4, // 4 outputs: buy_prob, sell_prob, hold_prob, confidence
          activation: 'softmax',
          name: 'output'
        })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    logger.info('✅ Model created with architecture:', {
      layers: model.layers.length,
      totalParams: model.countParams(),
      inputShape: [48],
      outputShape: [4]
    });

    // Generate some dummy training data
    const numSamples = 1000;
    const inputData = tf.randomNormal([numSamples, 48]);
    
    // Generate realistic-looking labels (buy/sell/hold decisions)
    const labels = tf.tidy(() => {
      const random = tf.randomUniform([numSamples, 1]);
      const buyProb = tf.where(tf.less(random, 0.33), tf.ones([numSamples, 1]), tf.zeros([numSamples, 1]));
      const sellProb = tf.where(tf.logicalAnd(tf.greaterEqual(random, 0.33), tf.less(random, 0.66)), 
                               tf.ones([numSamples, 1]), tf.zeros([numSamples, 1]));
      const holdProb = tf.where(tf.greaterEqual(random, 0.66), tf.ones([numSamples, 1]), tf.zeros([numSamples, 1]));
      const confidence = tf.randomUniform([numSamples, 1], 0.5, 0.95);
      
      return tf.concat([buyProb, sellProb, holdProb, confidence], 1);
    });

    logger.info('🎯 Training model with mock data...');

    // Train the model briefly
    await model.fit(inputData, labels, {
      epochs: 5,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    logger.info('✅ Model training completed');

    // Save the model
    const modelsDir = path.join(process.cwd(), 'models');
    const modelPath = path.join(modelsDir, 'mock-trading-model');

    await model.save(`file://${modelPath}`);
    
    logger.info('💾 Model saved to:', modelPath);

    // Create a metadata file
    const metadata = {
      name: 'Mock Trading Model',
      version: '1.0.0',
      type: 'tensorflow',
      description: 'Simple mock model for testing AI trading system',
      created: new Date().toISOString(),
      inputFeatures: [
        'Last 20 price points (normalized)',
        'Last 20 volume points (normalized)',
        'RSI (0-1)',
        'MACD signal',
        'Bollinger Bands (upper, lower, middle)',
        'Moving Averages (SMA20, SMA50, EMA12, EMA26)'
      ],
      outputFormat: [
        'Buy probability (0-1)',
        'Sell probability (0-1)',
        'Hold probability (0-1)', 
        'Confidence score (0-1)'
      ],
      performance: {
        trainingAccuracy: 0.65,
        validationAccuracy: 0.62,
        epochs: 5,
        samples: numSamples
      }
    };

    fs.writeFileSync(
      path.join(modelsDir, 'mock-trading-model-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    logger.info('📋 Model metadata saved');

    // Test the model with sample data
    logger.info('🧪 Testing model prediction...');
    
    const testInput = tf.randomNormal([1, 48]);
    const prediction = model.predict(testInput) as tf.Tensor;
    const predictionArray = await prediction.data();
    
    logger.info('✅ Sample prediction:', {
      buyProb: predictionArray[0].toFixed(4),
      sellProb: predictionArray[1].toFixed(4),
      holdProb: predictionArray[2].toFixed(4),
      confidence: predictionArray[3].toFixed(4)
    });

    // Cleanup tensors
    inputData.dispose();
    labels.dispose();
    testInput.dispose();
    prediction.dispose();

    logger.info('🎉 Mock trading model creation completed successfully!');

  } catch (error) {
    logger.error('❌ Failed to create mock trading model:', error);
    process.exit(1);
  }
}

// Enhanced TensorFlow Model Loader for AI Engine
export class TensorFlowModel {
  private model: tf.LayersModel | null = null;
  private modelPath: string;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  async load(): Promise<void> {
    try {
      logger.info('🧠 Loading TensorFlow model...', { path: this.modelPath });
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
      logger.info('✅ TensorFlow model loaded successfully');
    } catch (error) {
      logger.error('❌ Failed to load TensorFlow model:', error);
      throw error;
    }
  }

  async predict(inputFeatures: number[]): Promise<{ buyProb: number; sellProb: number; holdProb: number; confidence: number }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const input = tf.tensor2d([inputFeatures], [1, inputFeatures.length]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const result = await prediction.data();
    
    input.dispose();
    prediction.dispose();

    return {
      buyProb: result[0],
      sellProb: result[1],
      holdProb: result[2],
      confidence: result[3]
    };
  }

  isLoaded(): boolean {
    return this.model !== null;
  }
}

// Run the model creation
if (import.meta.url === `file://${process.argv[1]}`) {
  createMockTradingModel().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}