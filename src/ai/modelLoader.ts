import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

export interface ModelPrediction {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  expectedPrice?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface TradingModel {
  predict(input: ModelInput): Promise<ModelPrediction>;
  getModelInfo(): ModelInfo;
  isLoaded(): boolean;
}

export interface ModelInput {
  prices: number[];      // Recent price history
  volumes: number[];     // Recent volume history
  indicators: {          // Technical indicators
    rsi: number;
    macd: number;
    bollinger: { upper: number; lower: number; middle: number };
    sma: { sma20: number; sma50: number };
    ema: { ema12: number; ema26: number };
  };
  timeframe: string;
  symbol: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  type: 'onnx' | 'tensorflow' | 'simple';
  description: string;
  inputShape: number[];
  outputShape: number[];
}

/**
 * ONNX Model Wrapper
 */
export class ONNXModel implements TradingModel {
  private session: any = null;
  private modelPath: string;
  private modelInfo: ModelInfo;

  constructor(modelPath: string, modelInfo: ModelInfo) {
    this.modelPath = modelPath;
    this.modelInfo = modelInfo;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🧠 Initializing ONNX model...', {
        component: 'ONNXModel',
        modelPath: this.modelPath
      });

      // Dynamically import ONNX Runtime (will be installed later)
      const ort = await import('onnxruntime-node');
      
      // Load model from file
      const modelBuffer = readFileSync(this.modelPath);
      this.session = await ort.InferenceSession.create(modelBuffer);
      
      logger.info('✅ ONNX model loaded successfully', {
        component: 'ONNXModel',
        inputNames: this.session.inputNames,
        outputNames: this.session.outputNames
      });
    } catch (error) {
      logger.error('❌ Failed to load ONNX model', {
        component: 'ONNXModel',
        error: error instanceof Error ? error.message : String(error),
        modelPath: this.modelPath
      });
      throw error;
    }
  }

  async predict(input: ModelInput): Promise<ModelPrediction> {
    if (!this.session) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    try {
      // Prepare input tensor from market data
      const inputTensor = this.prepareInputTensor(input);
      
      // Run inference
      const feeds = { [this.session.inputNames[0]]: inputTensor };
      const results = await this.session.run(feeds);
      
      // Parse output
      const output = results[this.session.outputNames[0]];
      return this.parseModelOutput(output.data as Float32Array);
      
    } catch (error) {
      logger.error('❌ Model prediction failed', {
        component: 'ONNXModel',
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to simple prediction
      return this.fallbackPrediction(input);
    }
  }

  private prepareInputTensor(input: ModelInput): any {
    // Convert market data to model input format
    const features = [
      ...input.prices.slice(-20), // Last 20 prices
      ...input.volumes.slice(-20), // Last 20 volumes
      input.indicators.rsi / 100, // Normalized RSI
      input.indicators.macd,
      input.indicators.bollinger.upper,
      input.indicators.bollinger.lower,
      input.indicators.sma.sma20,
      input.indicators.sma.sma50,
      input.indicators.ema.ema12,
      input.indicators.ema.ema26
    ];

    // Pad or truncate to expected input shape
    const expectedLength = this.modelInfo.inputShape[1] || 48;
    while (features.length < expectedLength) features.push(0);
    features.splice(expectedLength);

    // Create tensor (placeholder for actual ONNX tensor creation)
    return {
      data: new Float32Array(features),
      dims: [1, expectedLength],
      type: 'float32'
    };
  }

  private parseModelOutput(output: Float32Array): ModelPrediction {
    // Assume model outputs [buy_prob, sell_prob, hold_prob, confidence]
    const [buyProb = 0, sellProb = 0, holdProb = 0, confidence = 0.5] = Array.from(output);
    
    let action: 'buy' | 'sell' | 'hold';
    let maxProb = Math.max(buyProb, sellProb, holdProb);
    
    if (maxProb === buyProb) action = 'buy';
    else if (maxProb === sellProb) action = 'sell';
    else action = 'hold';

    const finalConfidence = confidence || maxProb;

    return {
      action,
      confidence: finalConfidence,
      riskLevel: finalConfidence > 0.8 ? 'low' : finalConfidence > 0.6 ? 'medium' : 'high'
    };
  }

  private fallbackPrediction(input: ModelInput): ModelPrediction {
    // Simple fallback based on RSI
    const rsi = input.indicators.rsi;
    
    if (rsi < 30) {
      return { action: 'buy', confidence: 0.7, riskLevel: 'medium' };
    } else if (rsi > 70) {
      return { action: 'sell', confidence: 0.7, riskLevel: 'medium' };
    } else {
      return { action: 'hold', confidence: 0.5, riskLevel: 'low' };
    }
  }

  getModelInfo(): ModelInfo {
    return this.modelInfo;
  }

  isLoaded(): boolean {
    return this.session !== null;
  }
}

/**
 * Simple Rule-Based Model (fallback)
 */
export class SimpleModel implements TradingModel {
  private modelInfo: ModelInfo = {
    name: 'Simple Rule-Based Model',
    version: '1.0.0',
    type: 'simple',
    description: 'Basic technical analysis rules',
    inputShape: [1, 10],
    outputShape: [1, 3]
  };

  async predict(input: ModelInput): Promise<ModelPrediction> {
    const { indicators } = input;
    const currentPrice = input.prices[input.prices.length - 1];
    const previousPrice = input.prices[input.prices.length - 2];
    
    // Validate inputs
    if (!currentPrice || !previousPrice) {
      return { action: 'hold', confidence: 0.3, riskLevel: 'high' };
    }
    
    // Multi-factor analysis
    let buyScore = 0;
    let sellScore = 0;
    let confidence = 0.5;

    // RSI Analysis
    if (indicators.rsi < 30) {
      buyScore += 2; // Oversold
      confidence += 0.1;
    } else if (indicators.rsi > 70) {
      sellScore += 2; // Overbought
      confidence += 0.1;
    }

    // MACD Analysis
    if (indicators.macd > 0) {
      buyScore += 1;
    } else {
      sellScore += 1;
    }

    // Bollinger Bands
    if (currentPrice < indicators.bollinger.lower) {
      buyScore += 1; // Price below lower band
    } else if (currentPrice > indicators.bollinger.upper) {
      sellScore += 1; // Price above upper band
    }

    // Moving Average Crossover
    if (indicators.sma.sma20 > indicators.sma.sma50) {
      buyScore += 1; // Bullish crossover
    } else {
      sellScore += 1; // Bearish crossover
    }

    // Price momentum
    if (currentPrice > previousPrice) {
      buyScore += 0.5;
    } else {
      sellScore += 0.5;
    }

    // Determine action
    let action: 'buy' | 'sell' | 'hold';
    if (buyScore > sellScore + 1) {
      action = 'buy';
      confidence = Math.min(0.9, confidence + (buyScore - sellScore) * 0.1);
    } else if (sellScore > buyScore + 1) {
      action = 'sell';
      confidence = Math.min(0.9, confidence + (sellScore - buyScore) * 0.1);
    } else {
      action = 'hold';
      confidence = 0.5;
    }

    return {
      action,
      confidence,
      riskLevel: confidence > 0.7 ? 'low' : confidence > 0.5 ? 'medium' : 'high'
    };
  }

  getModelInfo(): ModelInfo {
    return this.modelInfo;
  }

  isLoaded(): boolean {
    return true; // Simple model is always ready
  }
}

/**
 * TensorFlow Model Wrapper
 */
export class TensorFlowModel implements TradingModel {
  private model: any = null;
  private modelPath: string;
  private modelInfo: ModelInfo;

  constructor(modelPath: string, modelInfo: ModelInfo) {
    this.modelPath = modelPath;
    this.modelInfo = modelInfo;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🧠 Initializing TensorFlow model...', {
        component: 'TensorFlowModel',
        modelPath: this.modelPath
      });

      // Dynamically import TensorFlow.js (will be available since we installed it)
      const tf = await import('@tensorflow/tfjs-node');
      
      // Load model from file
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
      
      logger.info('✅ TensorFlow model loaded successfully', {
        component: 'TensorFlowModel',
        inputShape: this.model.inputs[0].shape,
        outputShape: this.model.outputs[0].shape
      });
    } catch (error) {
      logger.error('❌ Failed to load TensorFlow model', {
        component: 'TensorFlowModel',
        error: error instanceof Error ? error.message : String(error),
        modelPath: this.modelPath
      });
      throw error;
    }
  }

  async predict(input: ModelInput): Promise<ModelPrediction> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    try {
      // Prepare input tensor from market data
      const inputFeatures = this.prepareInputFeatures(input);
      
      // Import TensorFlow for tensor operations
      const tf = await import('@tensorflow/tfjs-node');
      
      // Create tensor and run prediction
      const inputTensor = tf.tensor2d([inputFeatures], [1, inputFeatures.length]);
      const prediction = this.model.predict(inputTensor) as any;
      const result = await prediction.data();
      
      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Parse output
      return this.parseModelOutput(result);
      
    } catch (error) {
      logger.error('❌ TensorFlow model prediction failed', {
        component: 'TensorFlowModel',
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to simple prediction
      return this.fallbackPrediction(input);
    }
  }

  private prepareInputFeatures(input: ModelInput): number[] {
    // Convert market data to model input format (same as ONNX)
    const features = [
      ...input.prices.slice(-20), // Last 20 prices
      ...input.volumes.slice(-20), // Last 20 volumes
      input.indicators.rsi / 100, // Normalized RSI
      input.indicators.macd,
      input.indicators.bollinger.upper,
      input.indicators.bollinger.lower,
      input.indicators.sma.sma20,
      input.indicators.sma.sma50,
      input.indicators.ema.ema12,
      input.indicators.ema.ema26
    ];

    // Pad or truncate to expected input shape
    const expectedLength = this.modelInfo.inputShape[1] || 48;
    while (features.length < expectedLength) features.push(0);
    features.splice(expectedLength);

    return features;
  }

  private parseModelOutput(output: Float32Array): ModelPrediction {
    // Assume model outputs [buy_prob, sell_prob, hold_prob, confidence]
    const [buyProb = 0, sellProb = 0, holdProb = 0, confidence = 0.5] = Array.from(output);
    
    let action: 'buy' | 'sell' | 'hold';
    let maxProb = Math.max(buyProb, sellProb, holdProb);
    
    if (maxProb === buyProb) action = 'buy';
    else if (maxProb === sellProb) action = 'sell';
    else action = 'hold';

    const finalConfidence = confidence || maxProb;

    return {
      action,
      confidence: finalConfidence,
      riskLevel: finalConfidence > 0.8 ? 'low' : finalConfidence > 0.6 ? 'medium' : 'high'
    };
  }

  private fallbackPrediction(input: ModelInput): ModelPrediction {
    // Simple fallback based on RSI (same as ONNX)
    const rsi = input.indicators.rsi;
    
    if (rsi < 30) {
      return { action: 'buy', confidence: 0.7, riskLevel: 'medium' };
    } else if (rsi > 70) {
      return { action: 'sell', confidence: 0.7, riskLevel: 'medium' };
    } else {
      return { action: 'hold', confidence: 0.5, riskLevel: 'low' };
    }
  }

  getModelInfo(): ModelInfo {
    return this.modelInfo;
  }

  isLoaded(): boolean {
    return this.model !== null;
  }
}

/**
 * Model Factory and Manager
 */
export class ModelManager {
  private models: Map<string, TradingModel> = new Map();
  private defaultModel: string = 'simple';

  async loadModel(name: string, modelPath?: string): Promise<void> {
    try {
      if (name === 'simple') {
        const model = new SimpleModel();
        this.models.set(name, model);
        logger.info('✅ Simple model loaded', { component: 'ModelManager' });
        return;
      }

      if (!modelPath) {
        throw new Error(`Model path required for ${name}`);
      }

      // Check if it's a TensorFlow model (has model.json)
      if (modelPath.includes('mock-trading-model') || modelPath.endsWith('/model.json')) {
        const modelInfo: ModelInfo = {
          name: name,
          version: '1.0.0',
          type: 'tensorflow',
          description: `TensorFlow trading model: ${name}`,
          inputShape: [1, 48],
          outputShape: [1, 4]
        };

        const tfModel = new TensorFlowModel(modelPath.replace('/model.json', ''), modelInfo);
        await tfModel.initialize();
        
        this.models.set(name, tfModel);
        logger.info('✅ TensorFlow model loaded successfully', {
          component: 'ModelManager',
          modelName: name
        });
        return;
      }

      // Try to load ONNX model
      const modelInfo: ModelInfo = {
        name: name,
        version: '1.0.0',
        type: 'onnx',
        description: `ONNX trading model: ${name}`,
        inputShape: [1, 48],
        outputShape: [1, 4]
      };

      const onnxModel = new ONNXModel(modelPath, modelInfo);
      await onnxModel.initialize();
      
      this.models.set(name, onnxModel);
      logger.info('✅ ONNX model loaded successfully', {
        component: 'ModelManager',
        modelName: name
      });

    } catch (error) {
      logger.warn('⚠️ Failed to load model, falling back to simple model', {
        component: 'ModelManager',
        modelName: name,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to simple model, but don't set it under the requested name
      if (!this.models.has('simple')) {
        this.models.set('simple', new SimpleModel());
      }
      
      // Don't create the requested model if it failed to load
      throw error;
    }
  }

  async predict(input: ModelInput, modelName?: string): Promise<ModelPrediction> {
    const model = this.models.get(modelName || this.defaultModel);
    
    if (!model) {
      throw new Error(`Model not found: ${modelName || this.defaultModel}`);
    }

    return model.predict(input);
  }

  getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  setDefaultModel(modelName: string): void {
    if (!this.models.has(modelName)) {
      throw new Error(`Model not available: ${modelName}`);
    }
    this.defaultModel = modelName;
  }

  getModelInfo(modelName?: string): ModelInfo {
    const model = this.models.get(modelName || this.defaultModel);
    if (!model) {
      throw new Error(`Model not found: ${modelName || this.defaultModel}`);
    }
    return model.getModelInfo();
  }
}