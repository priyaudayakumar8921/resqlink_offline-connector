package com.resqlink.adapter;

import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.resqlink.R;
import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.ui.admin.SOSDetailActivity;

import java.util.ArrayList;
import java.util.List;

public class SOSAdapter extends RecyclerView.Adapter<SOSAdapter.SOSViewHolder> {
    private List<SOSMessageEntity> sosList = new ArrayList<>();

    public void setSosList(List<SOSMessageEntity> sosList) {
        this.sosList = sosList;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public SOSViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_sos, parent, false);
        return new SOSViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull SOSViewHolder holder, int position) {
        SOSMessageEntity sos = sosList.get(position);
        holder.tvSosId.setText(sos.messageId);
        holder.tvType.setText(sos.emergencyType);
        
        if (sos.latitude != null && sos.longitude != null) {
            holder.tvLocation.setText(sos.latitude + ", " + sos.longitude);
        } else {
            holder.tvLocation.setText("Location unavailable");
        }
        
        holder.tvTime.setText(sos.timestamp);

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(v.getContext(), SOSDetailActivity.class);
            intent.putExtra("SOS_ID", sos.messageId);
            v.getContext().startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return sosList.size();
    }

    static class SOSViewHolder extends RecyclerView.ViewHolder {
        TextView tvSosId, tvType, tvLocation, tvTime;

        public SOSViewHolder(@NonNull View itemView) {
            super(itemView);
            tvSosId = itemView.findViewById(R.id.tvSosId);
            tvType = itemView.findViewById(R.id.tvType);
            tvLocation = itemView.findViewById(R.id.tvLocation);
            tvTime = itemView.findViewById(R.id.tvTime);
        }
    }
}
