import { Form, Button, Segmented, Select, Tabs, Typography, Card, Switch, Flex } from "antd";
import { BottomActionSheet } from "../BottomActionSheet";
import { DownOutlined } from "@ant-design/icons";
import { InputField } from "../InputField";
import { DurationSelector } from "../DurationSelector";
import { ProfitThreshold, ThresholdSelector } from "../ProfitThreshold";
import { RiskManagement } from "../RiskManagement";
import { Schedules } from "../Schedules";
import {
  LabelPairedArrowLeftMdBoldIcon,
  LabelPairedCircleQuestionMdBoldIcon,
  MarketDerivedVolatility1001sIcon,
} from "@deriv/quill-icons";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, useBots } from "../../hooks/useBots";
import { TradeErrorBoundary } from "../ErrorBoundary/TradeErrorBoundary";
import { MarketInfo } from "../../types/market";
import MarketSelector from "../MarketSelector";
import "./styles.scss";

import { FormValues, StrategyFormProps, FieldConfig } from "../../types/form";

// Interface for the structured strategy form data
interface StrategyFormData {
  general: {
    botName: string;
    tradeType: string;
    market: string;
  };
  basicSettings: {
    number_of_trades: number | null;
    maximum_stake: number | null;
    tick_duration: unknown;
    compound_stake: boolean;
  };
  amounts: {
    amount: unknown;
    profit_threshold: unknown;
    loss_threshold: unknown;
  };
  recovery: {
    risk_steps: unknown;
  };
  schedules: {
    bot_schedules: unknown;
  };
  execution: {
    recovery_type: string | null;
    cooldown_period: { duration: number; unit: string } | null;
    stop_on_loss_streak: boolean;
    auto_restart: boolean;
  };
}

export function StrategyForm({
  config,
  strategyType,
  strategyId,
  onBack,
  editBot,
}: StrategyFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketInfo>();
  // We're not using submitTrade in this component
  const { addBot, updateBot } = useBots();
  const navigate = useNavigate();
  const isEditMode = !!editBot;

  const { Title } = Typography;

  // Function to build the structured form data object
  const buildStructuredFormData = useCallback((): StrategyFormData => {
    const values = form.getFieldsValue();
    
    const structuredData: StrategyFormData = {
      general: {
        botName: values.botName?.toString() || '',
        tradeType: values.tradeType?.toString() || '',
        market: values.market?.toString() || '',
      },
      basicSettings: {
        number_of_trades: values.number_of_trades as number | null,
        maximum_stake: values.maximum_stake as number | null,
        tick_duration: values.tick_duration,
        compound_stake: values.compound_stake as boolean || false,
      },
      amounts: {
        amount: values.amount,
        profit_threshold: values.profit_threshold,
        loss_threshold: values.loss_threshold,
      },
      recovery: {
        risk_steps: values.risk_steps,
      },
      schedules: {
        bot_schedules: values.bot_schedules,
      },
      execution: {
        recovery_type: values.recovery_type as string | null,
        cooldown_period: values.cooldown_period as { duration: number; unit: string } | null,
        stop_on_loss_streak: values.stop_on_loss_streak as boolean || false,
        auto_restart: values.auto_restart as boolean || false,
      },
    };

    return structuredData;
  }, [form]);

  // Helper function to log field updates
  const logFieldUpdate = useCallback((fieldName: string, value: unknown, tabKey?: string) => {
    console.log(`[Form Update] ${tabKey ? `[${tabKey}] ` : ''}${fieldName}:`, value);
    const structuredData = buildStructuredFormData();
    console.log("+++ FORM", structuredData);
  }, [buildStructuredFormData]);

  // Log the full structured form data
  const logFullFormData = useCallback(() => {
    const rawValues = form.getFieldsValue();
    const structuredData = buildStructuredFormData();
    console.log('[Form Data - Raw Values]', rawValues);
    console.log('[Form Data - Full Structure]', JSON.stringify(structuredData, null, 2));
    console.log('[Form Data - Object]', structuredData);
    return structuredData;
  }, [buildStructuredFormData, form]);

  useEffect(()=>{
    const structuredData = buildStructuredFormData();
    console.log("+++ FORM", structuredData);
  },[form, buildStructuredFormData])

// Render field based on type
  const renderField = (field: FieldConfig) => {
    const getPlaceholder = () => {
      if (field.name === 'amount') {
        return 'Enter base stake amount';
      }
      return `Enter ${field.label.toLowerCase()}`;
    };

    const commonProps = {
      label: field.label,
      placeholder: getPlaceholder(),
    };

    switch (field.type) {
      case 'heading':
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
          </Card>
        );
      
      case 'risk-management':
        return (
          <RiskManagement
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'recovery');
            }}
          />
        );
      
      case 'schedules':
        return (
          <Schedules
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'schedules');
            }}
          />
        );
      
      case 'duration-selector-with-heading':
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
            <div className="duration-selector-in-card">
              <DurationSelector
                onChange={(value) => {
                  form.setFieldValue(field.name, value);
                  logFieldUpdate(field.name, value, 'basicSettings');
                }}
              />
            </div>
          </Card>
        );
      
      case 'duration-selector':
        return (
          <DurationSelector
            {...commonProps}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'basicSettings');
            }}
          />
        );
      
      case 'profit-threshold':
        return (
          <ProfitThreshold
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'amounts');
            }}
          />
        );
      
      case 'threshold-selector':
        return (
          <ThresholdSelector
            label={field.label}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'amounts');
            }}
            fixedPlaceholder={field.name === 'amount' ? 'Enter base stake amount' : 'Enter fixed loss amount'}
            percentagePlaceholder={field.name === 'amount' ? 'Enter percentage of balance for stake' : 'Enter percentage of balance for loss'}
            fixedHelperText={field.name === 'amount' ? 'Enter the base stake amount for trading' : 'Enter a fixed amount that will trigger loss prevention when reached'}
            percentageHelperText={field.name === 'amount' ? 'Stake will be calculated as this percentage of your account balance' : 'Loss will be calculated as this percentage of your account balance'}
          />
        );
      
      case 'select':
        return (
          <div className="select-field">
            <label className="input-field-label">{field.label}</label>
            <Select
              placeholder={commonProps.placeholder}
              options={field.options}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value);
              }}
              style={{ width: '100%' }}
              size="large"
            />
          </div>
        );
      
      case 'number-prefix':
        return (
          <InputField
            {...commonProps}
            type="number-prefix"
            suffix={field.prefixType === 'currency' ? '$' : 
                   field.prefixType === 'percentage' ? '%' :
                   field.prefixType === 'multiplier' ? '×' : ''}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'basicSettings');
            }}
          />
        );
      
      case 'number':
        return (
          <InputField
            {...commonProps}
            type="number"
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'basicSettings');
            }}
          />
        );
      
      case 'switch-with-helper':
        return (
          <Flex justify="space-between" align="center" >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{field.label}</span>
            </div>
            <Switch 
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'execution');
              }}
            />
          </Flex>
        );
      
      case 'recovery-type':
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">{field.label}</Title>
            </div>
            <Segmented
              block
              options={[
                { label: 'Conservative', value: 'conservative' },
                { label: 'Neutral', value: 'neutral' },
                { label: 'Aggressive', value: 'aggressive' },
              ]}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'execution');
              }}
            />
            <div className="recovery-type-description">
              <span className="description-text">
                Controls how quickly the bot recovers from losses
              </span>
            </div>
          </Card>
        );
      
      case 'cooldown-period':
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">{field.label}</Title>
            </div>
            <Flex justify="space-between" align="center" gap={12} >
              <InputField
                type="number"
                placeholder="Duration"
                onChange={(value) => {
                  const newValue = { duration: value, unit: form.getFieldValue(field.name)?.unit || 'seconds' };
                  form.setFieldValue(field.name, newValue);
                  logFieldUpdate(field.name, newValue, 'execution');
                }}
              /><Segmented
              block
                    options={[
                      { label: 'Sec', value: 'seconds' },
                      { label: 'Min', value: 'minutes' },
                      { label: 'Hour', value: 'hours' },
                    ]}
                    defaultValue="seconds"
                    onChange={(value) => {
                      const newValue = { duration: form.getFieldValue(field.name)?.duration || 0, unit: value };
                      form.setFieldValue(field.name, newValue);
                      logFieldUpdate(field.name, newValue, 'execution');
                    }}
                    className="cooldown-segment"
                  />
            </Flex>
            <div className="cooldown-description">
              <span className="description-text">
                Wait time between consecutive trades after a loss
              </span>
            </div>
          </Card>
        );
      
      case 'max-trades-control':
        return (
          <div className="max-trades-field">
            <div className="field-label-row">
              <span className="field-label">{field.label}</span>
              <LabelPairedCircleQuestionMdBoldIcon 
                style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              />
            </div>
            <div className="max-trades-controls">
              <Button 
                className="stepper-btn"
                onClick={() => {
                  const current = form.getFieldValue(field.name) || 1;
                  if (current > 1) form.setFieldValue(field.name, current - 1);
                }}
              >
                −
              </Button>
              <span className="trades-value">{form.getFieldValue(field.name) || 1}</span>
              <Button 
                className="stepper-btn"
                onClick={() => {
                  const current = form.getFieldValue(field.name) || 1;
                  form.setFieldValue(field.name, current + 1);
                }}
              >
                +
              </Button>
            </div>
            <div className="max-trades-description">
              <span className="description-text">
                Maximum number of trades running at the same time
              </span>
            </div>
          </div>
        );
      
      case 'trade-interval':
        return (
          <div className="trade-interval-field">
            <div className="field-label-row">
              <span className="field-label">{field.label}</span>
              <LabelPairedCircleQuestionMdBoldIcon 
                style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              />
            </div>
            <div className="interval-controls">
              <InputField
                type="number"
                placeholder="Enter interval"
                onChange={(value) => form.setFieldValue(field.name, { interval: value, unit: form.getFieldValue(field.name)?.unit || 'seconds' })}
              />
              <Segmented
                options={[
                  { label: 'Sec', value: 'seconds' },
                  { label: 'Min', value: 'minutes' },
                ]}
                defaultValue="seconds"
                onChange={(value) => form.setFieldValue(field.name, { interval: form.getFieldValue(field.name)?.interval || 0, unit: value })}
              />
            </div>
            <div className="interval-description">
              <span className="description-text">
                Minimum time between starting new trades
              </span>
            </div>
          </div>
        );
      
      default:
        return (
          <InputField
            {...commonProps}
            type="text"
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
    }
  };

  // Set initial form values when in edit mode
  useEffect(() => {
    if (isEditMode && editBot) {
      // Find param values from the bot
      const repeatTradeParam = editBot.params.find(param => param.key === "repeat_trade");
      const initialStakeParam = editBot.params.find(param => param.key === "initial_stake");
      
      // Set form values
      form.setFieldsValue({
        botName: editBot.name,
        tradeType: editBot.tradeType,
        market: editBot.market,
        repeatTrade: repeatTradeParam ? repeatTradeParam.value : 2,
        initialStake: initialStakeParam ? initialStakeParam.value : 10,
      });
    }
  }, [isEditMode, editBot, form]);

  const handleSubmit = async (values: FormValues) => {
    // Log the full structured form data
    const structuredFormData = logFullFormData();
    console.log('[Form Submit] Structured Strategy Data:', structuredFormData);
    
    // for now some values here are static 
    // once we have the api we will make this function dynamic based on the api schema
    // Get the current form values
    const currentValues = form.getFieldsValue();
    
    const botData : Bot = {
      id: isEditMode && editBot ? editBot.id : Date.now().toString(),
      // Use the form value for botName, only fallback to "New Strategy Bot" if it's empty
      name: currentValues.botName ? currentValues.botName.toString() : "New Strategy Bot",
      market: values.market?.toString() || "",
      tradeType: values.tradeType?.toString() || "",
      // Use the strategy ID from props instead of hardcoding "Custom"
      strategy: isEditMode && editBot ? editBot.strategy : strategyType,
      // Store the strategy ID for API calls when the bot is run
      strategyId: strategyId,
      params: [
        { key: "repeat_trade", label: "Repeat trade", value: Number(values.repeatTrade) },
        { key: "initial_stake", label: "Initial stake", value: Number(values.initialStake) },
      ],
    };

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        // Update existing bot
        updateBot(botData);
        console.log("Bot updated successfully:", botData);
        
        // Close the drawer first, then navigate
        onBack?.();
        navigate("/bots");
      } else {
        // Add new bot
        addBot(botData);
        console.log("Bot created successfully:", botData);
        
        // Navigate to the bots list page
        navigate("/bots");
      }
    } catch (error) {
      console.error("Failed to create/update bot:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };


  return (
    <TradeErrorBoundary onReset={handleReset}>
      <div className="strategy-form-container">
        <div className="strategy-form-header">
          <div className="header-left">
            <Button
              type="text"
              icon={<LabelPairedArrowLeftMdBoldIcon />}
              className="back-button"
              onClick={onBack}
            />
          </div>
          <div className="header-right">
            <Button
              type="text"
              shape="circle"
              icon={<LabelPairedCircleQuestionMdBoldIcon />}
              className="help-button"
            />
          </div>
        </div>

        <h1 className="strategy-title">{strategyType} strategy</h1>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="strategy-form"
          initialValues={{
            botName: "Test-01",
            tradeType: "Rise",
            market: "Volatility 100 (1s) Index",
            initialStake: 10,
            repeatTrade: 2,
          }}
        >
          <Form.Item name="botName">
            <InputField
              label="Bot name"
              type="text"
              className="bot-name-input"
            />
          </Form.Item>

          {/* Render tabbed fields from config */}
          {config?.tabs ? (
            <Tabs
              defaultActiveKey="advanced"
              items={config.tabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                children: (
                  <div className="tab-content fixed-heightx">
                    {/* Add tradeType and market Form.Items to the first tab (advanced) */}
                    {tab.key === 'advanced' && (
                      <>
                        <Form.Item name="tradeType" className="trade-type-item">
                          <Segmented
                            block
                            options={[
                              { label: "Rise", value: "Rise" },
                              { label: "Fall", value: "Fall" },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item name="market" className="market-item">
                          <InputField 
                            type="selectable" 
                            value={"Volatility 100 (1s) Index"}
                            prefix={<MarketDerivedVolatility1001sIcon fill='#000000' iconSize='sm' />}
                            suffix={<DownOutlined />}
                            onClick={() => setShowMarketSelector(true)}
                          />
                        </Form.Item>
                      </>
                    )}
                    {tab.fields.map((field) => (
                      <Form.Item key={field.name} name={field.name} className={`${field.type}-item`}>
                        {renderField(field)}
                      </Form.Item>
                    ))}
                  </div>
                ),
              }))}
              className="strategy-tabs"
            />
          ) : (
            /* Render flat fields for backward compatibility */
            config?.fields?.map((field) => (
              <Form.Item key={field.name} name={field.name} className={`${field.type}-item`}>
                {renderField(field)}
              </Form.Item>
            ))
          )}
        </Form>

        <div className="form-footer">
          <Button
            type="primary"
            block
            className="create-button"
            onClick={() => form.submit()}
            loading={isSubmitting}
          >
            {isEditMode ? "Update bot" : "Create bot"}
          </Button>
        </div>
      </div>

      {/* Market Selector */}
      <BottomActionSheet
        isOpen={showMarketSelector}
        onClose={() => setShowMarketSelector(false)}
        className="market-selector-drawer"
        height="80vh"
      >
        <MarketSelector
          onSelectMarket={(market) => {
            setSelectedMarket(market);
            form.setFieldsValue({ market: market.displayName });
            setShowMarketSelector(false);
          }}
          selectedMarket={selectedMarket}
        />
      </BottomActionSheet>
    </TradeErrorBoundary>
  );
}
